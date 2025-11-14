import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginForm } from "@/components/LoginForm";
import { ChatPage } from "@/pages/chat";
import { generateKeyPair, type KeyPair } from "@/lib/crypto";

interface UserSession {
  username: string;
  keyPair: KeyPair;
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userSession");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem("userSession");
      }
    }
  }, []);

  const handleLogin = (username: string) => {
    const keyPair = generateKeyPair();
    const newSession: UserSession = {
      username,
      keyPair,
    };
    setSession(newSession);
    localStorage.setItem("userSession", JSON.stringify(newSession));
    console.log("User logged in:", username);
    console.log("Public key:", keyPair.publicKey);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("userSession");
    console.log("User logged out");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {session ? (
            <ChatPage
              username={session.username}
              publicKey={session.keyPair.publicKey}
              secretKey={session.keyPair.secretKey}
              onLogout={handleLogout}
            />
          ) : (
            <LoginForm onLogin={handleLogin} />
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
