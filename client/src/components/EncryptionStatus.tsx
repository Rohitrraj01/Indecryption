import { Shield, Key, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateKey } from "@/lib/crypto";

interface EncryptionStatusProps {
  yourPublicKey: string;
  recipientPublicKey?: string;
  recipientUsername?: string;
}

export function EncryptionStatus({
  yourPublicKey,
  recipientPublicKey,
  recipientUsername,
}: EncryptionStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Encryption Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Your Public Key</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <code className="text-xs font-mono break-all">{truncateKey(yourPublicKey, 12)}</code>
          </div>
        </div>

        {recipientUsername && recipientPublicKey && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">{recipientUsername}'s Public Key</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <code className="text-xs font-mono break-all">{truncateKey(recipientPublicKey, 12)}</code>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-status-online/10 rounded-lg">
              <CheckCircle className="w-4 h-4 text-status-online flex-shrink-0" />
              <span className="text-xs text-status-online font-medium">
                Secure channel established
              </span>
            </div>
          </>
        )}

        {!recipientUsername && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Select a user to view encryption details
          </div>
        )}
      </CardContent>
    </Card>
  );
}
