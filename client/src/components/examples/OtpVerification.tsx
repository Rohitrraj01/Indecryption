import { OtpVerification } from "../OtpVerification";

export default function OtpVerificationExample() {
  return (
    <OtpVerification
      mobileNumber="9876543210"
      onVerify={(otp) => console.log("Verify OTP:", otp)}
      onResend={() => console.log("Resend OTP")}
      onBack={() => console.log("Go back")}
    />
  );
}
