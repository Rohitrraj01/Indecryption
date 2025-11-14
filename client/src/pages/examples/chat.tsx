import { ThemeProvider } from "@/lib/theme-provider";
import { ChatPage } from "../chat";

export default function ChatPageExample() {
  return (
    <ThemeProvider>
      <ChatPage
        username="testuser"
        publicKey="AbCdEf1234567890XyZAbCdEf1234567890XyZ"
        secretKey="secretKeyExample1234567890"
        onLogout={() => console.log("Logout clicked")}
      />
    </ThemeProvider>
  );
}
