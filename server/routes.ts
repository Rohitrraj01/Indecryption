import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { sendOtpViaTwilio } from "./twilio";
import { insertUserSchema, insertContactSchema, insertMessageSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Encryption wrapper for indecryption.exe
async function encryptMessageViaEXE(
  message: string,
  senderNumber: string,
  receiverNumber: string
): Promise<{ success: boolean; ciphertext?: string; error?: string }> {
  try {
    const exePath = process.env.ENCRYPTION_EXE_PATH || 
      path.join(__dirname, "..", "indecryption.exe");
    
    console.log(`🔐 Using EXE at: ${exePath}`);
    
    const payload = {
      mode: "encrypt",
      args: [message, senderNumber, receiverNumber],
    };

    const payloadStr = JSON.stringify(payload);
    console.log(`📝 Payload: ${payloadStr}`);
    
    // Use a more reliable way to pass JSON to the EXE on Windows
    // Write to a temp file and pipe it
    const fs = await import("fs").then(m => m.promises);
    const tmpFile = path.join(__dirname, `tmp-${Date.now()}.json`);
    
    try {
      await fs.writeFile(tmpFile, payloadStr, 'utf8');
      console.log(`💾 Temp file created: ${tmpFile}`);
      
      // Pass the file content via stdin using cmd.exe
      const command = `type "${tmpFile}" | "${exePath}"`;
      console.log(`▶️  Executing: ${command}`);
      
      console.log(`🔐 Encrypting message via indecryption.exe...`);
      const { stdout, stderr } = await execPromise(command, { 
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
        shell: 'cmd.exe',
      });
      
      console.log(`📤 EXE stdout: ${stdout}`);

      if (stderr) {
        console.error("EXE stderr:", stderr);
      }

      try {
        const result = JSON.parse(stdout.trim());
        
        if (result.error) {
          return { success: false, error: result.error };
        }

        if (!result.ciphertext) {
          return { success: false, error: "No ciphertext returned from EXE" };
        }

        console.log(`✅ Message encrypted: ${result.ciphertext.substring(0, 30)}...`);
        return { success: true, ciphertext: result.ciphertext };
      } catch (parseError) {
        console.error("Failed to parse EXE output:", stdout);
        return { success: false, error: "Invalid JSON response from EXE" };
      }
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error("Encryption failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function decryptMessageViaEXE(
  ciphertext: string,
  senderNumber: string,
  receiverNumber: string
): Promise<{ success: boolean; plaintext?: string; error?: string }> {
  try {
    const exePath = process.env.ENCRYPTION_EXE_PATH || 
      path.join(__dirname, "..", "indecryption.exe");
    
    console.log(`🔓 Using EXE at: ${exePath}`);
    
    const payload = {
      mode: "decrypt",
      args: [ciphertext, senderNumber, receiverNumber],
    };

    const payloadStr = JSON.stringify(payload);
    console.log(`📝 Decrypt Payload: ${payloadStr.substring(0, 100)}...`);
    
    // Use a more reliable way to pass JSON to the EXE on Windows
    const fs = await import("fs").then(m => m.promises);
    const tmpFile = path.join(__dirname, `tmp-${Date.now()}.json`);
    
    try {
      await fs.writeFile(tmpFile, payloadStr, 'utf8');
      console.log(`💾 Temp file created: ${tmpFile}`);
      
      // Pass the file content via stdin using cmd.exe
      const command = `type "${tmpFile}" | "${exePath}"`;
      console.log(`▶️  Executing decrypt: ${command.substring(0, 50)}...`);
      
      console.log(`🔓 Decrypting message via indecryption.exe...`);
      const { stdout, stderr } = await execPromise(command, { 
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
        shell: 'cmd.exe',
      });
      
      console.log(`📥 EXE stdout: ${stdout.substring(0, 100)}...`);

      if (stderr) {
        console.error("EXE stderr:", stderr);
      }

      try {
        const result = JSON.parse(stdout.trim());
        
        if (result.error) {
          return { success: false, error: result.error };
        }

        if (!result.plaintext) {
          return { success: false, error: "No plaintext returned from EXE" };
        }

        console.log(`✅ Message decrypted`);
        return { success: true, plaintext: result.plaintext };
      } catch (parseError) {
        console.error("Failed to parse EXE decrypt output:", stdout);
        return { success: false, error: "Invalid JSON response from EXE" };
      }
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store active socket connections
  const userSockets = new Map<string, string>();

  // Auth Routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { mobileNumber } = req.body;

      if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
        return res.status(400).json({ error: "Valid 10-digit mobile number required" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await storage.createOtpCode({
        mobileNumber,
        code: otp,
        expiresAt,
      });

      // Send OTP via Twilio
      const sendResult = await sendOtpViaTwilio(mobileNumber, otp);

      if (!sendResult.success) {
        console.error("Failed to send OTP via Twilio:", sendResult.error);
        return res.status(500).json({ error: "Failed to send OTP" });
      }

      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        otp: process.env.NODE_ENV === "development" ? otp : undefined 
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { username, mobileNumber, otp, publicKey } = req.body;

      if (!username || !mobileNumber || !otp || !publicKey) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const validOtp = await storage.getValidOtpCode(mobileNumber, otp);
      if (!validOtp) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }

      let user = await storage.getUserByMobileNumber(mobileNumber);
      
      if (!user) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already taken" });
        }

        user = await storage.createUser({
          username,
          mobileNumber,
          publicKey,
        });
      }

      await storage.updateUserVerification(user.id, true);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          mobileNumber: user.mobileNumber,
          publicKey: user.publicKey,
        },
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // User Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          publicKey: u.publicKey,
          isOnline: userSockets.has(u.username),
        }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:username/public-key", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ publicKey: user.publicKey });
    } catch (error) {
      console.error("Error fetching public key:", error);
      res.status(500).json({ error: "Failed to fetch public key" });
    }
  });

  // Contact Routes
  app.get("/api/search/users", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }

      const users = await storage.searchUsers(q.toLowerCase());
      
      const results = users.map((user) => ({
        id: user.id,
        username: user.username,
        mobileNumber: user.mobileNumber,
        isOnline: userSockets.has(user.username),
      }));

      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const { userId, contactUserId, nickname } = req.body;

      if (!userId || !contactUserId) {
        return res.status(400).json({ error: "userId and contactUserId required" });
      }

      // Prevent adding yourself as a contact
      if (userId === contactUserId) {
        return res.status(400).json({ error: "You cannot add yourself as a contact" });
      }

      // Check if contact already exists
      const existingContacts = await storage.getContactsByUserId(userId);
      if (existingContacts.some(c => c.contactUserId === contactUserId)) {
        return res.status(400).json({ error: "This contact already exists" });
      }

      const contact = await storage.addContact({
        userId,
        contactUserId,
        nickname: nickname || null,
      });

      res.json(contact);
    } catch (error) {
      console.error("Error adding contact:", error);
      res.status(500).json({ error: "Failed to add contact", details: String(error) });
    }
  });

  app.get("/api/contacts/:userId", async (req, res) => {
    try {
      const contacts = await storage.getContactsByUserId(req.params.userId);
      
      const contactsWithUsers = await Promise.all(
        contacts.map(async (contact) => {
          const user = await storage.getUser(contact.contactUserId);
          return user ? {
            id: user.id,
            username: user.username,
            publicKey: user.publicKey,
            isOnline: userSockets.has(user.username),
            nickname: contact.nickname || undefined,
          } : null;
        })
      );

      res.json(contactsWithUsers.filter((c) => c !== null));
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Message Routes
  app.get("/api/messages/:username1/:username2", async (req, res) => {
    try {
      const { username1, username2 } = req.params;
      const messages = await storage.getMessagesBetweenUsers(username1, username2);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Decrypt a single message
  app.post("/api/decrypt-message", async (req, res) => {
    try {
      console.log(`🔓 Decrypt request body:`, req.body);
      
      const { ciphertext, senderNumber, receiverNumber } = req.body;
      
      if (!ciphertext || !senderNumber || !receiverNumber) {
        console.error(`❌ Missing fields - ciphertext: ${!!ciphertext}, senderNumber: ${!!senderNumber}, receiverNumber: ${!!receiverNumber}`);
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await decryptMessageViaEXE(ciphertext, senderNumber, receiverNumber);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ plaintext: result.plaintext });
    } catch (error) {
      console.error("Error decrypting message:", error);
      res.status(500).json({ error: "Failed to decrypt message" });
    }
  });

  // Socket.IO for real-time messaging
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", (username: string) => {
      userSockets.set(username, socket.id);
      console.log(`\n👤 User registered: ${username}`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Active users: ${Array.from(userSockets.keys()).join(", ")}`);
      
      io.emit("user_status", {
        username,
        isOnline: true,
      });
    });

    socket.on("send_message", async (data: {
      fromUsername: string;
      toUsername: string;
      plaintext?: string;
      ciphertext?: string; // fallback for old format
      nonce?: string;
      fromMobileNumber?: string;
      toMobileNumber?: string;
    }) => {
      try {
        console.log(`\n📤 Message from ${data.fromUsername} → ${data.toUsername}`);
        
        // Use plaintext if provided, fallback to ciphertext
        const messageText = data.plaintext || data.ciphertext || "";
        
        if (!messageText) {
          socket.emit("message_error", { error: "Empty message" });
          return;
        }

        // Get user mobile numbers
        let senderMobileNumber = data.fromMobileNumber;
        let receiverMobileNumber = data.toMobileNumber;

        if (!senderMobileNumber || !receiverMobileNumber) {
          const fromUser = await storage.getUserByUsername(data.fromUsername);
          const toUser = await storage.getUserByUsername(data.toUsername);
          
          if (!fromUser || !toUser) {
            socket.emit("message_error", { error: "User not found" });
            return;
          }
          
          senderMobileNumber = fromUser.mobileNumber;
          receiverMobileNumber = toUser.mobileNumber;
        }

        console.log(`   Sender: ${senderMobileNumber}, Receiver: ${receiverMobileNumber}`);
        console.log(`   Active users: ${Array.from(userSockets.keys()).join(", ")}`);

        // Encrypt using indecryption.exe
        const encryptResult = await encryptMessageViaEXE(
          messageText,
          senderMobileNumber,
          receiverMobileNumber
        );

        if (!encryptResult.success) {
          console.error(`❌ Encryption failed: ${encryptResult.error}`);
          socket.emit("message_error", { 
            error: `Encryption failed: ${encryptResult.error}` 
          });
          return;
        }

        const { randomUUID } = await import("crypto");
        const tempMessageId = randomUUID();
        const timestamp = new Date();

        const recipientSocketId = userSockets.get(data.toUsername);
        console.log(`   Recipient "${data.toUsername}" socket: ${recipientSocketId ? "✓ FOUND" : "✗ NOT FOUND"}`);

        if (recipientSocketId) {
          // Emit to specific recipient socket
          io.to(recipientSocketId).emit("receive_message", {
            id: tempMessageId,
            fromUsername: data.fromUsername,
            toUsername: data.toUsername,
            ciphertext: encryptResult.ciphertext,
            timestamp,
          });
          console.log(`   ✓ Delivered encrypted message`);
        } else {
          // Fallback: broadcast to all connected clients
          console.log(`   ⚠️  Broadcasting to all clients...`);
          io.emit("receive_message", {
            id: tempMessageId,
            fromUsername: data.fromUsername,
            toUsername: data.toUsername,
            ciphertext: encryptResult.ciphertext,
            timestamp,
          });
        }

        // Send confirmation immediately to sender
        socket.emit("message_sent", {
          id: tempMessageId,
          timestamp,
        });

        // Save encrypted message to database in background
        storage.saveMessage({
          fromUsername: data.fromUsername,
          toUsername: data.toUsername,
          ciphertext: encryptResult.ciphertext!,
          nonce: "", // Not needed with indecryption.exe
        }).catch((error) => {
          console.error("Error saving message:", error);
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      let disconnectedUsername: string | null = null;
      userSockets.forEach((socketId, username) => {
        if (socketId === socket.id) {
          disconnectedUsername = username;
        }
      });
      
      if (disconnectedUsername) {
        userSockets.delete(disconnectedUsername);
        io.emit("user_status", {
          username: disconnectedUsername,
          isOnline: false,
        });
        console.log(`User ${disconnectedUsername} disconnected`);
      }
    });
  });

  // Cleanup expired OTPs periodically
  setInterval(async () => {
    await storage.deleteExpiredOtpCodes();
  }, 60000); // Every minute

  return httpServer;
}
