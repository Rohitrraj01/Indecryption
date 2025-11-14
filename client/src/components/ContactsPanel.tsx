import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Users, MessageSquare } from "lucide-react";
import { UserListItem } from "./UserListItem";
import { AddContactDialog } from "./AddContactDialog";

interface Contact {
  id: string;
  username: string;
  publicKey: string;
  isOnline: boolean;
  nickname?: string;
  unreadCount?: number;
}

interface ContactsPanelProps {
  contacts: Contact[];
  allUsers: Contact[];
  selectedUserId?: string;
  onSelectContact: (contact: Contact) => void;
  onAddContact: (userId: string, nickname?: string) => void;
}

export function ContactsPanel({
  contacts,
  allUsers,
  selectedUserId,
  onSelectContact,
  onAddContact,
}: ContactsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  const filteredContacts = contacts.filter(
    (c) =>
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Contacts</h2>
          <AddContactDialog onAddContact={onAddContact} />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-contacts"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts" className="text-xs" data-testid="tab-contacts">
              <MessageSquare className="w-3 h-3 mr-2" />
              Contacts ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs" data-testid="tab-all-users">
              <Users className="w-3 h-3 mr-2" />
              All Users
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="flex-1 overflow-hidden">
        <TabsContent value="contacts" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="relative">
                    <UserListItem
                      username={contact.nickname || contact.username}
                      publicKey={contact.publicKey}
                      isOnline={contact.isOnline}
                      isSelected={selectedUserId === contact.id}
                      onClick={() => onSelectContact(contact)}
                    />
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? "No contacts found" : "No contacts yet. Add some!"}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {filteredAllUsers.length > 0 ? (
                filteredAllUsers.map((user) => (
                  <UserListItem
                    key={user.id}
                    username={user.username}
                    publicKey={user.publicKey}
                    isOnline={user.isOnline}
                    isSelected={selectedUserId === user.id}
                    onClick={() => onSelectContact(user)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
