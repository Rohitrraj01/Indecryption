import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AddContactDialogProps {
  onAddContact: (userId: string, nickname?: string) => void;
}

interface SearchResult {
  id: string;
  username: string;
  mobileNumber: string;
  isOnline: boolean;
}

export function AddContactDialog({ onAddContact }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
    const mockResults: SearchResult[] = [
      { id: "1", username: "alice_wonder", mobileNumber: "9876543210", isOnline: true },
      { id: "2", username: "bob_builder", mobileNumber: "9876543211", isOnline: false },
      { id: "3", username: "charlie_brown", mobileNumber: "9876543212", isOnline: true },
    ].filter(u => 
      u.username.includes(searchQuery.toLowerCase()) || 
      u.mobileNumber.includes(searchQuery)
    );
    setSearchResults(mockResults);
  };

  const handleAddContact = () => {
    if (selectedUser) {
      onAddContact(selectedUser.id, nickname || undefined);
      setOpen(false);
      setSearchQuery("");
      setNickname("");
      setSelectedUser(null);
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-contact">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Search by username or mobile number to add contacts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Username or mobile number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
                data-testid="input-search-contact"
              />
            </div>
            <Button onClick={handleSearch} data-testid="button-search">
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 text-left ${
                      selectedUser?.id === user.id ? "bg-accent" : ""
                    }`}
                    data-testid={`button-select-user-${user.username}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.mobileNumber}</p>
                    </div>
                    {user.isOnline && (
                      <Badge variant="secondary" className="text-xs">
                        Online
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (Optional)</Label>
              <Input
                id="nickname"
                placeholder="Add a nickname for this contact"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                data-testid="input-nickname"
              />
            </div>
          )}

          <Button
            onClick={handleAddContact}
            disabled={!selectedUser}
            className="w-full"
            data-testid="button-confirm-add"
          >
            Add Contact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
