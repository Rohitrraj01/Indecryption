import { type User, type InsertUser, type OtpCode, type InsertOtpCode, type Contact, type InsertContact, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "chat.db");

// Initialize SQLite database
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    mobileNumber TEXT UNIQUE NOT NULL,
    publicKey TEXT NOT NULL,
    isVerified INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otpCodes (
    id TEXT PRIMARY KEY,
    mobileNumber TEXT NOT NULL,
    code TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    contactUserId TEXT NOT NULL,
    nickname TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (contactUserId) REFERENCES users(id),
    UNIQUE(userId, contactUserId)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    fromUsername TEXT NOT NULL,
    toUsername TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    nonce TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobileNumber);
  CREATE INDEX IF NOT EXISTS idx_contacts_userId ON contacts(userId);
  CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(fromUsername, toUsername);
  CREATE INDEX IF NOT EXISTS idx_otpCodes_mobile ON otpCodes(mobileNumber);
`);

console.log("✅ SQLite database initialized at", dbPath);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByMobileNumber(mobileNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(userId: string, isVerified: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  
  // OTP operations
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(mobileNumber: string, code: string): Promise<OtpCode | undefined>;
  deleteExpiredOtpCodes(): Promise<void>;
  
  // Contact operations
  addContact(contact: InsertContact): Promise<Contact>;
  getContactsByUserId(userId: string): Promise<Contact[]>;
  getContactWithUser(userId: string, contactUserId: string): Promise<(Contact & { user: User }) | undefined>;
  
  // Message operations
  saveMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(username1: string, username2: string, limit?: number): Promise<Message[]>;
}

export class SQLiteStorage implements IStorage {
  private mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      mobileNumber: row.mobileNumber,
      publicKey: row.publicKey,
      isVerified: Boolean(row.isVerified),
      createdAt: new Date(row.createdAt),
    };
  }

  private mapToOtpCode(row: any): OtpCode {
    return {
      id: row.id,
      mobileNumber: row.mobileNumber,
      code: row.code,
      expiresAt: new Date(row.expiresAt),
      createdAt: new Date(row.createdAt),
    };
  }

  private mapToContact(row: any): Contact {
    return {
      id: row.id,
      userId: row.userId,
      contactUserId: row.contactUserId,
      nickname: row.nickname,
      createdAt: new Date(row.createdAt),
    };
  }

  private mapToMessage(row: any): Message {
    return {
      id: row.id,
      fromUsername: row.fromUsername,
      toUsername: row.toUsername,
      ciphertext: row.ciphertext,
      nonce: row.nonce,
      timestamp: new Date(row.timestamp),
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as any;
    return row ? this.mapToUser(row) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const row = stmt.get(username) as any;
    return row ? this.mapToUser(row) : undefined;
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    const stmt = db.prepare("SELECT * FROM users WHERE mobileNumber = ?");
    const row = stmt.get(mobileNumber) as any;
    return row ? this.mapToUser(row) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const createdAt = new Date();
    const stmt = db.prepare(
      "INSERT INTO users (id, username, mobileNumber, publicKey, isVerified, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    );
    stmt.run(id, insertUser.username, insertUser.mobileNumber, insertUser.publicKey, 0, createdAt.toISOString());
    return {
      id,
      username: insertUser.username,
      mobileNumber: insertUser.mobileNumber,
      publicKey: insertUser.publicKey,
      isVerified: false,
      createdAt,
    };
  }

  async updateUserVerification(userId: string, isVerified: boolean): Promise<void> {
    const stmt = db.prepare("UPDATE users SET isVerified = ? WHERE id = ?");
    stmt.run(isVerified ? 1 : 0, userId);
  }

  async getAllUsers(): Promise<User[]> {
    const stmt = db.prepare("SELECT * FROM users ORDER BY createdAt DESC");
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapToUser(row));
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const stmt = db.prepare(
      "SELECT * FROM users WHERE LOWER(username) LIKE ? OR mobileNumber LIKE ? ORDER BY createdAt DESC"
    );
    const rows = stmt.all(lowerQuery, `%${query}%`) as any[];
    return rows.map(row => this.mapToUser(row));
  }

  // OTP operations
  async createOtpCode(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const id = randomUUID();
    const createdAt = new Date();
    const stmt = db.prepare(
      "INSERT INTO otpCodes (id, mobileNumber, code, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(id, insertOtp.mobileNumber, insertOtp.code, insertOtp.expiresAt.toISOString(), createdAt.toISOString());
    return {
      id,
      mobileNumber: insertOtp.mobileNumber,
      code: insertOtp.code,
      expiresAt: insertOtp.expiresAt,
      createdAt,
    };
  }

  async getValidOtpCode(mobileNumber: string, code: string): Promise<OtpCode | undefined> {
    const now = new Date().toISOString();
    const stmt = db.prepare(
      "SELECT * FROM otpCodes WHERE mobileNumber = ? AND code = ? AND expiresAt > ? ORDER BY createdAt DESC LIMIT 1"
    );
    const row = stmt.get(mobileNumber, code, now) as any;
    return row ? this.mapToOtpCode(row) : undefined;
  }

  async deleteExpiredOtpCodes(): Promise<void> {
    const now = new Date().toISOString();
    const stmt = db.prepare("DELETE FROM otpCodes WHERE expiresAt <= ?");
    stmt.run(now);
  }

  // Contact operations
  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const createdAt = new Date();
    const stmt = db.prepare(
      "INSERT INTO contacts (id, userId, contactUserId, nickname, createdAt) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(id, insertContact.userId, insertContact.contactUserId, insertContact.nickname || null, createdAt.toISOString());
    return {
      id,
      userId: insertContact.userId,
      contactUserId: insertContact.contactUserId,
      nickname: insertContact.nickname || null,
      createdAt,
    };
  }

  async getContactsByUserId(userId: string): Promise<Contact[]> {
    const stmt = db.prepare("SELECT * FROM contacts WHERE userId = ? ORDER BY createdAt DESC");
    const rows = stmt.all(userId) as any[];
    return rows.map(row => this.mapToContact(row));
  }

  async getContactWithUser(userId: string, contactUserId: string): Promise<(Contact & { user: User }) | undefined> {
    const contactStmt = db.prepare("SELECT * FROM contacts WHERE userId = ? AND contactUserId = ?");
    const contactRow = contactStmt.get(userId, contactUserId) as any;
    if (!contactRow) return undefined;
    
    const userStmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const userRow = userStmt.get(contactUserId) as any;
    if (!userRow) return undefined;
    
    return {
      ...this.mapToContact(contactRow),
      user: this.mapToUser(userRow),
    };
  }

  // Message operations
  async saveMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const timestamp = new Date();
    const stmt = db.prepare(
      "INSERT INTO messages (id, fromUsername, toUsername, ciphertext, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    );
    stmt.run(id, insertMessage.fromUsername, insertMessage.toUsername, insertMessage.ciphertext, insertMessage.nonce, timestamp.toISOString());
    return {
      id,
      fromUsername: insertMessage.fromUsername,
      toUsername: insertMessage.toUsername,
      ciphertext: insertMessage.ciphertext,
      nonce: insertMessage.nonce,
      timestamp,
    };
  }

  async getMessagesBetweenUsers(username1: string, username2: string, limit: number = 50): Promise<Message[]> {
    const stmt = db.prepare(
      `SELECT * FROM messages 
       WHERE (fromUsername = ? AND toUsername = ?) OR (fromUsername = ? AND toUsername = ?)
       ORDER BY timestamp ASC
       LIMIT ?`
    );
    const rows = stmt.all(username1, username2, username2, username1, limit) as any[];
    return rows.map(row => this.mapToMessage(row));
  }
}

export const storage = new SQLiteStorage();
