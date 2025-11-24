/**
 * Twilio configuration and utilities for the client
 * This handles SMS-related UI states and messages
 */

export interface TwilioConfig {
  isEnabled: boolean;
  phoneNumberFormat: 'E164' | '10DIGIT';
}

/**
 * Validate phone number format
 * Accepts:
 * - 10-digit Indian numbers: 9876543210
 * - E.164 format: +919876543210
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 10-digit number
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return true;
  }
  
  // E.164 format (with country code)
  if (cleaned.length > 10 && cleaned.length <= 15) {
    return true;
  }
  
  return false;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 10-digit number
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  // E.164 - format with spaces
  if (cleaned.length > 10) {
    const countryCode = cleaned.slice(0, -10);
    const number = cleaned.slice(-10);
    return `+${countryCode} ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  
  return phoneNumber;
}

/**
 * OTP input validation
 */
export function validateOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

/**
 * OTP timer utilities
 */
export const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
export const OTP_RESEND_COOLDOWN = 30 * 1000; // 30 seconds in milliseconds

export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${remainingSeconds}s`;
}

/**
 * OTP request status messages
 */
export const OTP_MESSAGES = {
  SENDING: 'Sending verification code...',
  SENT: 'Verification code sent successfully',
  SENT_DEV: 'Verification code sent (check console in dev mode)',
  RESEND_COUNTDOWN: 'Resend available in',
  RESEND_READY: 'Request new code',
  INVALID_NUMBER: 'Please enter a valid 10-digit phone number',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  OTP_EXPIRED: 'Verification code expired. Request a new one.',
  OTP_INVALID: 'Invalid verification code. Please try again.',
  VERIFICATION_SUCCESS: 'Phone number verified successfully',
};

/**
 * Track OTP attempt history (for rate limiting on client)
 */
export class OtpAttemptTracker {
  private attempts: number[] = [];
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  recordAttempt(): boolean {
    const now = Date.now();
    
    // Remove old attempts outside the window
    this.attempts = this.attempts.filter(time => now - time < this.windowMs);
    
    // Check if we've exceeded max attempts
    if (this.attempts.length >= this.maxAttempts) {
      return false;
    }
    
    this.attempts.push(now);
    return true;
  }

  getRemainingWaitTime(): number {
    if (this.attempts.length === 0) return 0;
    
    const oldestAttempt = this.attempts[0];
    const timeUntilReset = oldestAttempt + this.windowMs - Date.now();
    
    return Math.max(0, timeUntilReset);
  }

  reset(): void {
    this.attempts = [];
  }
}

export const otpTracker = new OtpAttemptTracker();
