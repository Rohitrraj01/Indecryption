import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Lock } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  recipientUsername?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  recipientUsername,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              recipientUsername
                ? `Send encrypted message to ${recipientUsername}...`
                : "Select a user to start chatting..."
            }
            disabled={disabled}
            className="resize-none min-h-[60px] pr-10"
            data-testid="input-message"
          />
          <Lock className="absolute right-3 top-3 w-4 h-4 text-status-online" />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-[60px] w-[60px]"
          data-testid="button-send"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      {recipientUsername && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          End-to-end encrypted with TweetNaCl
        </p>
      )}
    </form>
  );
}
