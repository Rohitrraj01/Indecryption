import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { truncateKey } from "@/lib/crypto";
import { User } from "lucide-react";

interface UserListItemProps {
  username: string;
  publicKey: string;
  isOnline: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function UserListItem({
  username,
  publicKey,
  isOnline,
  isSelected = false,
  onClick,
}: UserListItemProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 text-left transition-colors ${
        isSelected ? "bg-accent" : ""
      }`}
      data-testid={`button-user-${username}`}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
            isOnline ? "bg-status-online" : "bg-status-offline"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{username}</p>
          {isOnline && <Badge variant="secondary" className="text-xs py-0 h-5">Online</Badge>}
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {truncateKey(publicKey, 6)}
        </p>
      </div>
      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
