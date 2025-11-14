import { ThemeProvider } from "@/lib/theme-provider";
import { EnhancedChatPage } from "../enhanced-chat";

export default function EnhancedChatPageExample() {
  return (
    <ThemeProvider>
      <EnhancedChatPage
        username="testuser"
        publicKey="AbCdEf1234567890XyZAbCdEf1234567890XyZ"
        secretKey="secretKeyExample1234567890"
        mobileNumber="9876543210"
        onLogout={() => console.log("Logout clicked")}
      />
    </ThemeProvider>
  );
}
