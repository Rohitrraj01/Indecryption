import { io, Socket } from "socket.io-client";

interface SocketMessage {
  id: string;
  fromUsername: string;
  toUsername: string;
  ciphertext: string;
  nonce: string;
  timestamp: Date;
}

interface SocketEvents {
  receive_message: (message: SocketMessage) => void;
  message_sent: (data: { id: string; timestamp: Date }) => void;
  message_error: (data: { error: string }) => void;
  user_status: (data: { username: string; isOnline: boolean }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(username: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.socket?.emit("register", username);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    Object.keys(this.listeners).forEach((event) => {
      const callbacks = this.listeners.get(event);
      callbacks?.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    this.listeners.get(event)?.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  sendMessage(data: {
    fromUsername: string;
    toUsername: string;
    plaintext?: string; // NEW: plaintext for server-side encryption
    ciphertext?: string; // FALLBACK: pre-encrypted
    nonce?: string;
    fromMobileNumber?: string;
    toMobileNumber?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("send_message", data);
    } else {
      console.error("Socket not connected");
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
