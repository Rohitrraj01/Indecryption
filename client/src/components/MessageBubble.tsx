import { Lock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageBubbleProps {
  content: string;
  timestamp: Date;
  isSent: boolean;
  isEncrypted: boolean;
  senderUsername?: string;
}

export function MessageBubble({
  content,
  timestamp,
  isSent,
  isEncrypted,
  senderUsername,
}: MessageBubbleProps) {
  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
      data-testid={`message-${isSent ? "sent" : "received"}`}
    >
      <div className={`max-w-md space-y-1 ${isSent ? "items-end" : "items-start"} flex flex-col`}>
        {!isSent && senderUsername && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {senderUsername}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSent
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
          {isEncrypted ? (
            <Lock className="w-3 h-3 text-status-online" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-status-busy" />
          )}
        </div>
      </div>
    </div>
  );
}
