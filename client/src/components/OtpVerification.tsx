import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OtpVerificationProps {
  mobileNumber: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export function OtpVerification({ mobileNumber, onVerify, onResend, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleVerify = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleResend = () => {
    setIsResending(true);
    onResend();
    setTimeLeft(60);
    setOtp("");
    setTimeout(() => setIsResending(false), 1000);
  };

  const maskedNumber = `******${mobileNumber.slice(-4)}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-4 top-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Verify OTP</CardTitle>
            <CardDescription className="mt-2">
              Enter the 6-digit code sent to {maskedNumber}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              data-testid="input-otp"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={otp.length !== 6}
            data-testid="button-verify-otp"
          >
            Verify & Continue
          </Button>

          <div className="text-center space-y-2">
            {timeLeft > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {timeLeft}s
              </p>
            ) : (
              <Button
                variant="ghost"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm"
                data-testid="button-resend-otp"
              >
                {isResending ? "Sending..." : "Resend OTP"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
