import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { ChatHeader } from "@/components/ChatHeader";
import { EncryptionStatus } from "@/components/EncryptionStatus";
import { ContactsPanel } from "@/components/ContactsPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { userApi, contactApi, messageApi, type User, type Contact } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

interface EnhancedChatPageProps {
  userId: string;
  username: string;
  publicKey: string;
  secretKey: string;
  mobileNumber: string;
  onLogout: () => void;
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
  userId,
  username,
  publicKey,
  secretKey,
  mobileNumber,
  onLogout,
}: EnhancedChatPageProps) {
  const [selectedContact, setSelectedContact] = useState<(Contact & { user: User }) | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: contacts = [], refetch: refetchContacts } = useQuery({
    queryKey: ["/api/contacts", userId],
    queryFn: async () => {
      const data = await contactApi.getContacts(userId);
      return data.map((c) => ({ ...c, user: c.user! })).filter((c) => c.user);
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => userApi.getAllUsers(),
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: { contactUserId: string; nickname?: string }) => {
      return contactApi.addContact(userId, data.contactUserId, data.nickname);
    },
    onSuccess: () => {
      refetchContacts();
      toast({ title: "Contact Added", description: "Contact has been added successfully" });
    },
  });

  useEffect(() => {
    socketService.on("receive_message", (data) => {
      if (data.fromUsername !== selectedContact?.user.username) return;

      const recipientPublicKey = selectedContact.user.publicKey;
      const decrypted = decryptMessage(
        data.ciphertext,
        data.nonce,
        recipientPublicKey,
        secretKey
      );

      if (decrypted) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            content: decrypted,
            timestamp: new Date(data.timestamp),
            isSent: false,
            senderUsername: data.fromUsername,
            isEncrypted: true,
          },
        ]);
      }
    });

    socketService.on("user_status", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.username);
        } else {
          newSet.delete(data.username);
        }
        return newSet;
      });
    });

    return () => {
      socketService.off("receive_message", () => {});
      socketService.off("user_status", () => {});
    };
  }, [selectedContact, secretKey]);

  useEffect(() => {
    if (selectedContact) {
      messageApi.getMessages(username, selectedContact.user.username).then((msgs) => {
        const decryptedMessages = msgs.map((msg) => {
          const isSent = msg.fromUsername === username;
          const senderPubKey = isSent ? selectedContact.user.publicKey : publicKey;
          const decrypted = decryptMessage(
            msg.ciphertext,
            msg.nonce,
            senderPubKey,
            secretKey
          );

          return {
            id: msg.id,
            content: decrypted || "[Failed to decrypt]",
            timestamp: new Date(msg.timestamp),
            isSent,
            senderUsername: msg.fromUsername,
            isEncrypted: !!decrypted,
          };
        });

        setMessages(decryptedMessages);
      });
    }
  }, [selectedContact, username, publicKey, secretKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage(content: string) {
    if (!selectedContact) return;

    const encrypted = encryptMessage(content, selectedContact.user.publicKey, secretKey);
    if (!encrypted) {
      toast({ title: "Encryption Failed", description: "Could not encrypt message", variant: "destructive" });
      return;
    }

    socketService.sendMessage({
      fromUsername: username,
      toUsername: selectedContact.user.username,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        content,
        timestamp: new Date(),
        isSent: true,
        senderUsername: username,
        isEncrypted: true,
      },
    ]);
  }

  function handleAddContact(contactUserId: string, nickname?: string) {
    addContactMutation.mutate({ contactUserId, nickname });
  }

  function handleSelectContact(contact: Contact & { user: User }) {
    setSelectedContact(contact);
    setMessages([]);
  }

  const contactsWithOnline = contacts.map((c) => ({
    ...c,
    user: {
      ...c.user,
      isOnline: onlineUsers.has(c.user.username),
    },
  }));

  const allUsersWithOnline = allUsers.map((u) => ({
    id: u.id,
    username: u.username,
    publicKey: u.publicKey,
    isOnline: onlineUsers.has(u.username),
    userId,
    contactUserId: u.id,
    nickname: null,
    createdAt: new Date(),
    user: { ...u, isOnline: onlineUsers.has(u.username) },
  }));

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
          contacts={contactsWithOnline}
          allUsers={allUsersWithOnline}
          selectedUserId={selectedContact?.contactUserId}
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
          recipientUsername={selectedContact?.nickname || selectedContact?.user.username}
          isOnline={selectedContact?.user.isOnline}
        />

        <ScrollArea className="flex-1 p-4">
          {selectedContact ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
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
          recipientUsername={selectedContact?.nickname || selectedContact?.user.username}
        />
      </div>

      <div className="w-80 border-l p-4 hidden lg:block">
        <EncryptionStatus
          yourPublicKey={publicKey}
          recipientPublicKey={selectedContact?.user.publicKey}
          recipientUsername={selectedContact?.nickname || selectedContact?.user.username}
        />
      </div>
    </div>
  );
}
