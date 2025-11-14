import { type User, type InsertUser, type OtpCode, type InsertOtpCode, type Contact, type InsertContact, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByMobileNumber(mobileNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(userId: string, isVerified: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpCodes: Map<string, OtpCode>;
  private contacts: Map<string, Contact>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.otpCodes = new Map();
    this.contacts = new Map();
    this.messages = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobileNumber === mobileNumber
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date(), isVerified: false };
    this.users.set(id, user);
    return user;
  }

  async updateUserVerification(userId: string, isVerified: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isVerified = isVerified;
      this.users.set(userId, user);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // OTP operations
  async createOtpCode(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const id = randomUUID();
    const otp: OtpCode = { ...insertOtp, id, createdAt: new Date() };
    this.otpCodes.set(id, otp);
    return otp;
  }

  async getValidOtpCode(mobileNumber: string, code: string): Promise<OtpCode | undefined> {
    return Array.from(this.otpCodes.values()).find(
      (otp) => 
        otp.mobileNumber === mobileNumber && 
        otp.code === code && 
        otp.expiresAt > new Date()
    );
  }

  async deleteExpiredOtpCodes(): Promise<void> {
    const now = new Date();
    const idsToDelete: string[] = [];
    this.otpCodes.forEach((otp, id) => {
      if (otp.expiresAt <= now) {
        idsToDelete.push(id);
      }
    });
    idsToDelete.forEach(id => this.otpCodes.delete(id));
  }

  // Contact operations
  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { 
      ...insertContact, 
      id, 
      createdAt: new Date(),
      nickname: insertContact.nickname ?? null 
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContactsByUserId(userId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.userId === userId
    );
  }

  async getContactWithUser(userId: string, contactUserId: string): Promise<(Contact & { user: User }) | undefined> {
    const contact = Array.from(this.contacts.values()).find(
      (c) => c.userId === userId && c.contactUserId === contactUserId
    );
    
    if (!contact) return undefined;
    
    const user = this.users.get(contactUserId);
    if (!user) return undefined;
    
    return { ...contact, user };
  }

  // Message operations
  async saveMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { ...insertMessage, id, timestamp: new Date() };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBetweenUsers(username1: string, username2: string, limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(
        (msg) =>
          (msg.fromUsername === username1 && msg.toUsername === username2) ||
          (msg.fromUsername === username2 && msg.toUsername === username1)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return messages.slice(-limit);
  }
}

export const storage = new MemStorage();
