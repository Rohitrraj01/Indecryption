import { ThemeProvider } from "@/lib/theme-provider";
import { ChatHeader } from "../ChatHeader";

export default function ChatHeaderExample() {
  return (
    <ThemeProvider>
      <div className="w-full space-y-4">
        <ChatHeader recipientUsername="alice" isOnline={true} />
        <ChatHeader />
      </div>
    </ThemeProvider>
  );
}
