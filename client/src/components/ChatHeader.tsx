import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ChatHeaderProps {
  recipientUsername?: string;
  isOnline?: boolean;
}

export function ChatHeader({ recipientUsername, isOnline }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        {recipientUsername ? (
          <>
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {recipientUsername.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-status-online border-2 border-background" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2">
                {recipientUsername}
                <Lock className="w-3 h-3 text-status-online" />
              </h2>
              <p className="text-xs text-muted-foreground">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-semibold text-sm">Indecryption 2.0</h2>
            <p className="text-xs text-muted-foreground">Select a user to chat</p>
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}
