import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Phone, User } from "lucide-react";

interface MobileLoginFormProps {
  onSubmit: (username: string, mobileNumber: string) => void;
}

export function MobileLoginForm({ onSubmit }: MobileLoginFormProps) {
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && mobileNumber.trim()) {
      onSubmit(username.trim(), mobileNumber.trim());
    }
  };

  const formatMobileNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.slice(0, 10);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Indecryption 2.0</CardTitle>
            <CardDescription className="mt-2">
              Secure end-to-end encrypted messaging
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(formatMobileNumber(e.target.value))}
                  className="pl-10"
                  required
                  maxLength={10}
                  data-testid="input-mobile"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                You'll receive an OTP on your mobile number for verification.
                Your encryption keys will be generated automatically.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim() || mobileNumber.length !== 10}
              data-testid="button-send-otp"
            >
              Send OTP
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
