import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('⚠️  Twilio credentials not fully configured. OTP will be logged to console instead.');
}

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface OtpSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send OTP via Twilio SMS
 * Falls back to console logging in development without credentials
 */
export async function sendOtpViaTwilio(
  mobileNumber: string,
  otp: string
): Promise<OtpSendResult> {
  try {
    // Validate mobile number format
    const formattedNumber = formatPhoneNumber(mobileNumber);
    if (!formattedNumber) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    // If Twilio is not configured, log to console (development)
    if (!twilioClient || !twilioPhoneNumber) {
      console.log(`\n📱 [DEV MODE] OTP for ${formattedNumber}: ${otp}`);
      return {
        success: true,
        messageId: 'dev-mode-' + Date.now(),
      };
    }

    // Send via Twilio
    const message = await twilioClient.messages.create({
      body: `Your Indecryption 2.0 verification code is: ${otp}. Valid for 5 minutes.`,
      from: twilioPhoneNumber,
      to: formattedNumber,
    });

    console.log(`✅ OTP sent via Twilio. Message ID: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('❌ Error sending OTP via Twilio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    };
  }
}

/**
 * Format phone number to E.164 format
 * Assumes Indian numbers if no country code provided
 */
function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If 10 digits (Indian number), add +91
  if (digits.length === 10) {
    return '+91' + digits;
  }

  // If already has country code
  if (digits.length > 10) {
    return '+' + digits;
  }

  return null;
}

/**
 * Verify OTP validity (checks if not expired)
 * The actual comparison is done in the storage layer
 */
export function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export { twilioClient };
