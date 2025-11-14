import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Key } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
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
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Your encryption keys will be generated automatically when you log in.
                Keep your private key secure - it never leaves your device.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim()}
              data-testid="button-login"
            >
              Generate Keys & Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
