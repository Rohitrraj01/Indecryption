import { sendOtpViaTwilio } from './twilio';

export interface NotificationOptions {
  type: 'otp' | 'message-alert' | 'contact-request' | 'custom';
  phoneNumber: string;
  data?: Record<string, any>;
}

/**
 * Send OTP notification
 */
export async function sendOtpNotification(
  phoneNumber: string,
  otp: string
): Promise<boolean> {
  const result = await sendOtpViaTwilio(phoneNumber, otp);
  return result.success;
}

/**
 * Notify user about new message from offline sender
 */
export async function sendMessageAlert(
  phoneNumber: string,
  fromUsername: string
): Promise<boolean> {
  try {
    const hasCredentials = Boolean(
      (globalThis as any).process?.env?.TWILIO_ACCOUNT_SID && 
      (globalThis as any).process?.env?.TWILIO_AUTH_TOKEN
    );
    if (!hasCredentials) {
      console.log(`📱 [DEV MODE] Message alert for ${phoneNumber} from ${fromUsername}`);
      return true;
    }

    // This would use Twilio client directly, but for now we'll keep it simple
    console.log(`New message from ${fromUsername} to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending message alert:', error);
    return false;
  }
}

/**
 * Notify user about contact request
 */
export async function sendContactRequestAlert(
  phoneNumber: string,
  fromUsername: string
): Promise<boolean> {
  try {
    const hasCredentials = Boolean(
      (globalThis as any).process?.env?.TWILIO_ACCOUNT_SID && 
      (globalThis as any).process?.env?.TWILIO_AUTH_TOKEN
    );
    if (!hasCredentials) {
      console.log(`📱 [DEV MODE] Contact request alert for ${phoneNumber} from ${fromUsername}`);
      return true;
    }

    console.log(`Contact request from ${fromUsername} to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending contact request alert:', error);
    return false;
  }
}

/**
 * Send custom SMS notification
 */
export async function sendCustomNotification(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    const hasCredentials = Boolean(
      (globalThis as any).process?.env?.TWILIO_ACCOUNT_SID && 
      (globalThis as any).process?.env?.TWILIO_AUTH_TOKEN
    );
    if (!hasCredentials) {
      console.log(`📱 [DEV MODE] Custom notification to ${phoneNumber}: ${message}`);
      return true;
    }

    // Implement custom SMS sending here
    console.log(`Custom notification to ${phoneNumber}: ${message}`);
    return true;
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return false;
  }
}

export {
  sendOtpViaTwilio,
};
