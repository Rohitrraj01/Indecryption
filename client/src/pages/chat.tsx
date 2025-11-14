import { useState, useEffect, useRef } from "react";
import { UserListItem } from "@/components/UserListItem";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { ChatHeader } from "@/components/ChatHeader";
import { EncryptionStatus } from "@/components/EncryptionStatus";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ChatPageProps {
  username: string;
  publicKey: string;
  secretKey: string;
  onLogout: () => void;
}

interface User {
  username: string;
  publicKey: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isSent: boolean;
  senderUsername: string;
  isEncrypted: boolean;
}

export function ChatPage({ username, publicKey, secretKey, onLogout }: ChatPageProps) {
  const [users, setUsers] = useState<User[]>([
    { username: "alice", publicKey: "AbCdEf1234567890XyZAbCdEf1234567890XyZ", isOnline: true },
    { username: "bob", publicKey: "1234567890AbCdEfXyZ1234567890AbCdEf", isOnline: true },
    { username: "charlie", publicKey: "XyZ1234567890AbCdEfXyZ1234567890Ab", isOnline: false },
  ]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [keyPublished, setKeyPublished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!selectedUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isSent: true,
      senderUsername: username,
      isEncrypted: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    console.log("Message sent:", content);

    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! This is a demo response.",
        timestamp: new Date(),
        isSent: false,
        senderUsername: selectedUser.username,
        isEncrypted: true,
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handlePublishKey = () => {
    setKeyPublished(true);
    console.log("Public key published:", publicKey);
  };

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{username}</p>
              <p className="text-xs text-muted-foreground">Your account</p>
            </div>
          </div>
          <Button
            onClick={handlePublishKey}
            disabled={keyPublished}
            className="w-full"
            size="sm"
            data-testid="button-publish-key"
          >
            <Upload className="w-4 h-4 mr-2" />
            {keyPublished ? "Key Published" : "Publish Public Key"}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">Online Users</p>
            {users.map((user) => (
              <UserListItem
                key={user.username}
                username={user.username}
                publicKey={user.publicKey}
                isOnline={user.isOnline}
                isSelected={selectedUser?.username === user.username}
                onClick={() => setSelectedUser(user)}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full"
            size="sm"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ChatHeader
          recipientUsername={selectedUser?.username}
          isOnline={selectedUser?.isOnline}
        />

        <ScrollArea className="flex-1 p-4">
          {selectedUser ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages
                .filter(
                  (msg) =>
                    (msg.isSent && msg.senderUsername === username) ||
                    (!msg.isSent && msg.senderUsername === selectedUser.username)
                )
                .map((message) => (
                  <MessageBubble
                    key={message.id}
                    content={message.content}
                    timestamp={message.timestamp}
                    isSent={message.isSent}
                    isEncrypted={message.isEncrypted}
                    senderUsername={message.senderUsername}
                  />
                ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Welcome to Indecryption 2.0
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select a user from the sidebar to start an encrypted conversation.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All messages are end-to-end encrypted with TweetNaCl.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <MessageInput
          onSend={handleSendMessage}
          disabled={!selectedUser}
          recipientUsername={selectedUser?.username}
        />
      </div>

      <div className="w-80 border-l p-4 hidden lg:block">
        <EncryptionStatus
          yourPublicKey={publicKey}
          recipientPublicKey={selectedUser?.publicKey}
          recipientUsername={selectedUser?.username}
        />
      </div>
    </div>
  );
}
