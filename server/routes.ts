import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertUserSchema, insertContactSchema, insertMessageSchema } from "@shared/schema";

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

      console.log(`OTP for ${mobileNumber}: ${otp}`);

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
  app.post("/api/contacts", async (req, res) => {
    try {
      const { userId, contactUserId, nickname } = req.body;

      if (!userId || !contactUserId) {
        return res.status(400).json({ error: "userId and contactUserId required" });
      }

      const contact = await storage.addContact({
        userId,
        contactUserId,
        nickname: nickname || null,
      });

      res.json(contact);
    } catch (error) {
      console.error("Error adding contact:", error);
      res.status(500).json({ error: "Failed to add contact" });
    }
  });

  app.get("/api/contacts/:userId", async (req, res) => {
    try {
      const contacts = await storage.getContactsByUserId(req.params.userId);
      
      const contactsWithUsers = await Promise.all(
        contacts.map(async (contact) => {
          const user = await storage.getUser(contact.contactUserId);
          return {
            ...contact,
            user: user ? {
              id: user.id,
              username: user.username,
              publicKey: user.publicKey,
              isOnline: userSockets.has(user.username),
            } : null,
          };
        })
      );

      res.json(contactsWithUsers.filter((c) => c.user !== null));
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

  // Socket.IO for real-time messaging
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", (username: string) => {
      userSockets.set(username, socket.id);
      console.log(`User ${username} registered with socket ${socket.id}`);
      
      io.emit("user_status", {
        username,
        isOnline: true,
      });
    });

    socket.on("send_message", async (data: {
      fromUsername: string;
      toUsername: string;
      ciphertext: string;
      nonce: string;
    }) => {
      try {
        const message = await storage.saveMessage({
          fromUsername: data.fromUsername,
          toUsername: data.toUsername,
          ciphertext: data.ciphertext,
          nonce: data.nonce,
        });

        const recipientSocketId = userSockets.get(data.toUsername);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", {
            id: message.id,
            fromUsername: message.fromUsername,
            toUsername: message.toUsername,
            ciphertext: message.ciphertext,
            nonce: message.nonce,
            timestamp: message.timestamp,
          });
        }

        socket.emit("message_sent", {
          id: message.id,
          timestamp: message.timestamp,
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
