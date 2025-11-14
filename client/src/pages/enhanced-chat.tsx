import { useState, useEffect, useRef } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { ChatHeader } from "@/components/ChatHeader";
import { EncryptionStatus } from "@/components/EncryptionStatus";
import { ContactsPanel } from "@/components/ContactsPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EnhancedChatPageProps {
  username: string;
  publicKey: string;
  secretKey: string;
  mobileNumber: string;
  onLogout: () => void;
}

interface Contact {
  id: string;
  username: string;
  publicKey: string;
  isOnline: boolean;
  nickname?: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isSent: boolean;
  senderUsername: string;
  isEncrypted: boolean;
}

export function EnhancedChatPage({
  username,
  publicKey,
  secretKey,
  mobileNumber,
  onLogout,
}: EnhancedChatPageProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", username: "alice", nickname: "Alice W.", publicKey: "AbCdEf1234567890XyZ", isOnline: true, unreadCount: 2 },
    { id: "2", username: "bob", publicKey: "1234567890AbCdEfXyZ", isOnline: true },
  ]);

  const [allUsers] = useState<Contact[]>([
    ...contacts,
    { id: "3", username: "charlie", publicKey: "XyZ1234567890AbCdEf", isOnline: false },
    { id: "4", username: "david", publicKey: "Abc123XyZ456789", isOnline: true },
  ]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!selectedContact) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isSent: true,
      senderUsername: username,
      isEncrypted: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id && c.unreadCount
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! This is an encrypted response.",
        timestamp: new Date(),
        isSent: false,
        senderUsername: selectedContact.username,
        isEncrypted: true,
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handleAddContact = (userId: string, nickname?: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user && !contacts.find((c) => c.id === userId)) {
      setContacts((prev) => [...prev, { ...user, nickname }]);
      console.log("Contact added:", { userId, nickname });
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.unreadCount) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c))
      );
    }
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
              <p className="text-xs text-muted-foreground">{mobileNumber}</p>
            </div>
          </div>
        </div>

        <ContactsPanel
          contacts={contacts}
          allUsers={allUsers}
          selectedUserId={selectedContact?.id}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
        />

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
          recipientUsername={selectedContact?.nickname || selectedContact?.username}
          isOnline={selectedContact?.isOnline}
        />

        <ScrollArea className="flex-1 p-4">
          {selectedContact ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages
                .filter(
                  (msg) =>
                    (msg.isSent && msg.senderUsername === username) ||
                    (!msg.isSent && msg.senderUsername === selectedContact.username)
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
                    Select a contact to start an encrypted conversation.
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
          disabled={!selectedContact}
          recipientUsername={selectedContact?.nickname || selectedContact?.username}
        />
      </div>

      <div className="w-80 border-l p-4 hidden lg:block">
        <EncryptionStatus
          yourPublicKey={publicKey}
          recipientPublicKey={selectedContact?.publicKey}
          recipientUsername={selectedContact?.nickname || selectedContact?.username}
        />
      </div>
    </div>
  );
}
