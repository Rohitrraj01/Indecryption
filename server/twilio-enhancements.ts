/**
 * Future Twilio Integration Enhancement Examples
 * 
 * This file shows how to extend the current Twilio integration
 * with additional features like webhooks, templates, and advanced messaging.
 */

// ============================================================================
// 1. WEBHOOK SUPPORT - Track message delivery status
// ============================================================================

/*
// Add to server/twilio.ts:

import type { Request, Response } from 'express';

export interface DeliveryWebhook {
  MessageSid: string;
  AccountSid: string;
  MessageStatus: 'queued' | 'sent' | 'failed' | 'delivered' | 'undelivered';
  To: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  Timestamp: string;
}

export async function handleTwilioWebhook(req: Request, res: Response) {
  try {
    const { MessageSid, MessageStatus, To, ErrorCode } = req.body as DeliveryWebhook;
    
    // Log delivery status
    console.log(`Message ${MessageSid} to ${To}: ${MessageStatus}`);
    
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      console.error(`Failed to deliver to ${To}: ${ErrorCode}`);
      // Implement retry logic or alert user
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
}

// Add to server/routes.ts:
app.post('/api/webhooks/twilio', handleTwilioWebhook);
*/

// ============================================================================
// 2. SMS TEMPLATES - For different message types
// ============================================================================

/*
export const SMS_TEMPLATES = {
  OTP: (otp: string) => 
    `Your Indecryption verification code is: ${otp}. Valid for 5 minutes.`,
  
  MESSAGE_ALERT: (from: string) => 
    `You have a new message from ${from} on Indecryption.`,
  
  CONTACT_REQUEST: (from: string) => 
    `${from} sent you a contact request on Indecryption.`,
  
  SECURITY_ALERT: (action: string) => 
    `Security Alert: ${action} on your Indecryption account.`,
  
  WELCOME: (username: string) => 
    `Welcome to Indecryption, ${username}! Start secure messaging now.`,
};

export async function sendTemplatedMessage(
  phoneNumber: string,
  templateName: keyof typeof SMS_TEMPLATES,
  ...args: string[]
) {
  if (!twilioClient || !twilioPhoneNumber) {
    console.log(`📱 [DEV] SMS Template: ${templateName} - Args: ${args.join(', ')}`);
    return { success: true };
  }
  
  const template = SMS_TEMPLATES[templateName];
  const message = template(...args);
  
  return twilioClient.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: formatPhoneNumber(phoneNumber)!,
  });
}
*/

// ============================================================================
// 3. RATE LIMITING - Prevent OTP spam
// ============================================================================

/*
export class RateLimiter {
  private attempts = new Map<string, number[]>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(t => now - t < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  getRetryAfter(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = attempts[0];
    const retryAfter = oldestAttempt + this.windowMs - Date.now();
    
    return Math.max(0, retryAfter);
  }
}

export const otpRateLimiter = new RateLimiter();

// Add to routes.ts send-otp endpoint:
if (!otpRateLimiter.isAllowed(mobileNumber)) {
  const retryAfter = otpRateLimiter.getRetryAfter(mobileNumber);
  return res.status(429).json({
    error: 'Too many OTP requests',
    retryAfter: Math.ceil(retryAfter / 1000),
  });
}
*/

// ============================================================================
// 4. MULTI-CHANNEL FALLBACK - SMS + Email
// ============================================================================

/*
import nodemailer from 'nodemailer';

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpMultiChannel(
  phoneNumber: string,
  email: string,
  otp: string
): Promise<{ sms: boolean; email: boolean }> {
  const smsResult = await sendOtpViaTwilio(phoneNumber, otp);
  
  let emailResult = false;
  if (email) {
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@indecryption.com',
        to: email,
        subject: 'Your Indecryption Verification Code',
        html: `
          <h2>Verify Your Phone Number</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 2.5em; letter-spacing: 0.1em;">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
          <p style="color: #999; font-size: 0.9em;">
            If you didn't request this, please ignore this email.
          </p>
        `,
      });
      emailResult = true;
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
  
  return { sms: smsResult.success, email: emailResult };
}
*/

// ============================================================================
// 5. ADVANCED LOGGING & MONITORING
// ============================================================================

/*
export interface OtpLog {
  id: string;
  phoneNumber: string;
  timestamp: Date;
  status: 'sent' | 'failed' | 'verified' | 'expired';
  twilioMessageId?: string;
  errorCode?: string;
  duration?: number; // ms between send and verify
}

export class OtpLogger {
  private logs: Map<string, OtpLog> = new Map();

  logSent(phoneNumber: string, messageId: string): void {
    const id = `${phoneNumber}-${Date.now()}`;
    this.logs.set(id, {
      id,
      phoneNumber,
      timestamp: new Date(),
      status: 'sent',
      twilioMessageId: messageId,
    });
  }

  logVerified(phoneNumber: string, duration: number): void {
    // Mark as verified
    const logs = Array.from(this.logs.values())
      .filter(log => log.phoneNumber === phoneNumber && log.status === 'sent')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (logs[0]) {
      logs[0].status = 'verified';
      logs[0].duration = duration;
    }
  }

  logFailed(phoneNumber: string, errorCode: string): void {
    const id = `${phoneNumber}-${Date.now()}`;
    this.logs.set(id, {
      id,
      phoneNumber,
      timestamp: new Date(),
      status: 'failed',
      errorCode,
    });
  }

  getAnalytics(period: 'hour' | 'day' | 'week'): object {
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[period];

    const recentLogs = Array.from(this.logs.values())
      .filter(log => Date.now() - log.timestamp.getTime() < periodMs);

    return {
      total: recentLogs.length,
      sent: recentLogs.filter(l => l.status === 'sent').length,
      verified: recentLogs.filter(l => l.status === 'verified').length,
      failed: recentLogs.filter(l => l.status === 'failed').length,
      successRate: (recentLogs.filter(l => l.status === 'verified').length / 
                   recentLogs.filter(l => l.status !== 'failed').length * 100).toFixed(2) + '%',
    };
  }
}

export const otpLogger = new OtpLogger();
*/

// ============================================================================
// 6. TWILIO VERIFY SERVICE - Built-in verification
// ============================================================================

/*
import twilio from 'twilio';

const verifyClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
).verify.services(process.env.TWILIO_VERIFY_SERVICE_SID);

// Start verification
export async function startVerification(phoneNumber: string, channel: 'sms' | 'call' = 'sms') {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  const verification = await verifyClient.verifications.create({
    to: formattedNumber,
    channel,
  });

  return {
    sid: verification.sid,
    status: verification.status,
  };
}

// Check verification code
export async function checkVerificationCode(phoneNumber: string, code: string) {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  const verification = await verifyClient.verificationChecks.create({
    to: formattedNumber,
    code,
  });

  return {
    valid: verification.status === 'approved',
    status: verification.status,
  };
}
*/

// ============================================================================
// 7. ENVIRONMENT VARIABLES EXTENSION
// ============================================================================

/*
// Add to .env.example:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxx

// Email configuration
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@indecryption.com

// Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=debug
*/

// ============================================================================
// 8. CLIENT-SIDE ENHANCEMENTS
// ============================================================================

/*
// client/src/lib/twilio-config.ts additions:

export interface SmsTemplateContext {
  username?: string;
  senderName?: string;
  action?: string;
}

export function getLocalizedOtpMessage(language: 'en' | 'hi' | 'es'): string {
  const messages = {
    en: 'Enter the 6-digit code sent to your phone',
    hi: 'अपने फोन पर भेजा गया 6-अंकीय कोड दर्ज करें',
    es: 'Ingrese el código de 6 dígitos enviado a su teléfono',
  };
  return messages[language];
}

export async function checkSmsDeliveryStatus(messageId: string): Promise<string> {
  const response = await fetch(`/api/messages/${messageId}/status`);
  const data = await response.json();
  return data.status; // 'sent', 'delivered', 'failed', etc.
}
*/

export default {
  webhooks: 'Use to track SMS delivery status',
  templates: 'Pre-built message templates for different scenarios',
  rateLimiting: 'Prevent OTP spam attacks',
  multiChannel: 'Send OTP via SMS + Email',
  logging: 'Detailed analytics and monitoring',
  verifyService: 'Use Twilio built-in verification service',
  i18n: 'Multi-language OTP messages',
  clientEnhancements: 'Delivery status, localization',
};
