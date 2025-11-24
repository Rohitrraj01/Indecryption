import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  publicKey: string;
  isOnline?: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  nickname: string | null;
  createdAt: Date;
  user?: User;
}

export interface Message {
  id: string;
  fromUsername: string;
  toUsername: string;
  ciphertext: string;
  nonce: string;
  timestamp: Date;
}

export const authApi = {
  async sendOtp(mobileNumber: string) {
    const res = await apiRequest(
      "POST",
      "/api/auth/send-otp",
      { mobileNumber }
    );
    return await res.json() as { success: boolean; message: string; otp?: string };
  },

  async verifyOtp(username: string, mobileNumber: string, otp: string, publicKey: string) {
    const res = await apiRequest(
      "POST",
      "/api/auth/verify-otp",
      { username, mobileNumber, otp, publicKey }
    );
    return await res.json() as { success: boolean; user: User };
  },
};

export const userApi = {
  async getAllUsers() {
    const res = await apiRequest("GET", "/api/users");
    return await res.json() as User[];
  },

  async getPublicKey(username: string) {
    const res = await apiRequest("GET", `/api/users/${username}/public-key`);
    return await res.json() as { publicKey: string };
  },
};

export const contactApi = {
  async addContact(userId: string, contactUserId: string, nickname?: string) {
    const res = await apiRequest("POST", "/api/contacts", { userId, contactUserId, nickname });
    return await res.json() as Contact;
  },

  async getContacts(userId: string) {
    const res = await apiRequest("GET", `/api/contacts/${userId}`);
    return await res.json() as Contact[];
  },
};

export const messageApi = {
  async getMessages(username1: string, username2: string) {
    const res = await apiRequest("GET", `/api/messages/${username1}/${username2}`);
    return await res.json() as Message[];
  },

  async decryptMessage(ciphertext: string, senderNumber: string, receiverNumber: string) {
    const res = await apiRequest("POST", "/api/decrypt-message", {
      ciphertext,
      senderNumber,
      receiverNumber,
    });
    return await res.json() as { plaintext: string };
  },
};
