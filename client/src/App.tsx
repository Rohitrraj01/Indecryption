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
import { authApi } from "@/lib/api";
import { socketService } from "@/lib/socket";

type AuthStep = "login" | "otp" | "authenticated";

interface UserSession {
  userId: string;
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
    console.log("App mounted, checking for saved session...");
    const stored = localStorage.getItem("userSession");
    console.log("localStorage.userSession:", stored ? "EXISTS" : "EMPTY");
    
    if (stored) {
      try {
        const parsedSession = JSON.parse(stored);
        console.log("Parsed session:", { username: parsedSession.username, userId: parsedSession.userId });
        
        // Verify all required fields exist
        if (parsedSession.userId && parsedSession.username && parsedSession.mobileNumber && parsedSession.keyPair) {
          console.log("✓ Session valid, restoring for:", parsedSession.username);
          setSession(parsedSession);
          setAuthStep("authenticated");
          socketService.connect(parsedSession.username);
          console.log("✓ Session restored successfully");
        } else {
          console.warn("✗ Incomplete session data:", { 
            hasUserId: !!parsedSession.userId,
            hasUsername: !!parsedSession.username,
            hasMobileNumber: !!parsedSession.mobileNumber,
            hasKeyPair: !!parsedSession.keyPair
          });
          localStorage.removeItem("userSession");
        }
      } catch (error) {
        console.error("✗ Failed to restore session:", error);
        localStorage.removeItem("userSession");
      }
    } else {
      console.log("No saved session found");
    }
  }, []);

  async function handleLoginSubmit(username: string, mobileNumber: string) {
    try {
      const response = await authApi.sendOtp(mobileNumber);
      
      setPendingAuth({ username, mobileNumber });
      setAuthStep("otp");
      
      if (response.otp) {
        toast({ title: "Development OTP", description: `Your OTP is: ${response.otp}` });
      } else {
        toast({ title: "OTP Sent", description: `Verification code sent to ${mobileNumber}` });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    }
  }

  async function handleOtpVerify(otp: string) {
    if (!pendingAuth) return;

    try {
      const keyPair = generateKeyPair();
      
      const response = await authApi.verifyOtp(
        pendingAuth.username,
        pendingAuth.mobileNumber,
        otp,
        keyPair.publicKey
      );

      const newSession: UserSession = {
        userId: response.user.id,
        username: pendingAuth.username,
        mobileNumber: pendingAuth.mobileNumber,
        keyPair,
      };

      setSession(newSession);
      setAuthStep("authenticated");
      const sessionString = JSON.stringify(newSession);
      localStorage.setItem("userSession", sessionString);
      console.log("Session saved:", { username: newSession.username, userId: newSession.userId });
      console.log("localStorage check:", localStorage.getItem("userSession") ? "✓ Saved" : "✗ Not saved");

      socketService.connect(pendingAuth.username);

      toast({ title: "Authentication Successful", description: "Your encryption keys have been generated" });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP",
        variant: "destructive",
      });
    }
  }

  async function handleOtpResend() {
    if (!pendingAuth) return;

    try {
      const response = await authApi.sendOtp(pendingAuth.mobileNumber);
      
      if (response.otp) {
        toast({ title: "Development OTP", description: `Your OTP is: ${response.otp}` });
      } else {
        toast({ title: "OTP Resent", description: `New verification code sent to ${pendingAuth.mobileNumber}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
    }
  }

  function handleBackToLogin() {
    setAuthStep("login");
    setPendingAuth(null);
  }

  function handleLogout() {
    socketService.disconnect();
    setSession(null);
    setAuthStep("login");
    setPendingAuth(null);
    localStorage.removeItem("userSession");
    
    toast({ title: "Logged Out", description: "You have been securely logged out" });
  }

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
              userId={session.userId}
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
