import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLoginForm } from "@/components/MobileLoginForm";
import { OtpVerification } from "@/components/OtpVerification";
import { EnhancedChatPage } from "@/pages/enhanced-chat";
import { generateKeyPair, type KeyPair } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

type AuthStep = "login" | "otp" | "authenticated";

interface UserSession {
  username: string;
  mobileNumber: string;
  keyPair: KeyPair;
}

interface PendingAuth {
  username: string;
  mobileNumber: string;
}

function App() {
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [session, setSession] = useState<UserSession | null>(null);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("userSession");
    if (stored) {
      try {
        const parsedSession = JSON.parse(stored);
        setSession(parsedSession);
        setAuthStep("authenticated");
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem("userSession");
      }
    }
  }, []);

  const handleLoginSubmit = (username: string, mobileNumber: string) => {
    setPendingAuth({ username, mobileNumber });
    setAuthStep("otp");
    
    console.log("Sending OTP to:", mobileNumber);
    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${mobileNumber}`,
    });
  };

  const handleOtpVerify = (otp: string) => {
    console.log("Verifying OTP:", otp);
    
    if (!pendingAuth) return;

    const keyPair = generateKeyPair();
    const newSession: UserSession = {
      username: pendingAuth.username,
      mobileNumber: pendingAuth.mobileNumber,
      keyPair,
    };

    setSession(newSession);
    setAuthStep("authenticated");
    localStorage.setItem("userSession", JSON.stringify(newSession));

    toast({
      title: "Authentication Successful",
      description: "Your encryption keys have been generated",
    });

    console.log("User authenticated:", pendingAuth.username);
    console.log("Public key:", keyPair.publicKey);
  };

  const handleOtpResend = () => {
    if (pendingAuth) {
      console.log("Resending OTP to:", pendingAuth.mobileNumber);
      toast({
        title: "OTP Resent",
        description: `New verification code sent to ${pendingAuth.mobileNumber}`,
      });
    }
  };

  const handleBackToLogin = () => {
    setAuthStep("login");
    setPendingAuth(null);
  };

  const handleLogout = () => {
    setSession(null);
    setAuthStep("login");
    setPendingAuth(null);
    localStorage.removeItem("userSession");
    
    toast({
      title: "Logged Out",
      description: "You have been securely logged out",
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {authStep === "login" && (
            <MobileLoginForm onSubmit={handleLoginSubmit} />
          )}
          
          {authStep === "otp" && pendingAuth && (
            <OtpVerification
              mobileNumber={pendingAuth.mobileNumber}
              onVerify={handleOtpVerify}
              onResend={handleOtpResend}
              onBack={handleBackToLogin}
            />
          )}
          
          {authStep === "authenticated" && session && (
            <EnhancedChatPage
              username={session.username}
              publicKey={session.keyPair.publicKey}
              secretKey={session.keyPair.secretKey}
              mobileNumber={session.mobileNumber}
              onLogout={handleLogout}
            />
          )}
          
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
