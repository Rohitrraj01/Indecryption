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
import { UserPlus, Search, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a username or mobile number");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/search/users?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const results: SearchResult[] = await response.json();

      if (results.length === 0) {
        setError("No users found");
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search users. Please try again.");
      toast({
        title: "Search Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedUser) return;

    try {
      // Get userId from userSession
      const userSessionStr = localStorage.getItem("userSession");
      if (!userSessionStr) {
        throw new Error("User not authenticated");
      }
      
      const userSession = JSON.parse(userSessionStr);
      const userId = userSession.userId;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          contactUserId: selectedUser.id,
          nickname: nickname || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add contact");
      }

      toast({
        title: "Success",
        description: `Added ${selectedUser.username} as a contact`,
      });

      onAddContact(selectedUser.id, nickname || undefined);
      setOpen(false);
      setSearchQuery("");
      setNickname("");
      setSelectedUser(null);
      setSearchResults([]);
      setError(null);
    } catch (err) {
      console.error("Add contact error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add contact";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
                data-testid="input-search-contact"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSearch}
              data-testid="button-search"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

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
