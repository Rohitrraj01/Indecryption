# Indecryption 2.0 - Twilio Integration Guide

## Overview

This document explains how to set up and use Twilio integration in your Indecryption 2.0 encrypted chat application for OTP delivery via SMS.

## Setup Instructions

### 1. Get Twilio Credentials

1. Sign up for a Twilio account at [https://www.twilio.com/](https://www.twilio.com/)
2. Verify your email and phone number
3. Get your credentials from the Twilio Console:
   - **Account SID**: Found at the top of your Twilio Console Dashboard
   - **Auth Token**: Found next to the Account SID
   - **Phone Number**: A Twilio phone number assigned to your account (format: +1234567890)

### 2. Configure Environment Variables

Create a `.env` file in the root directory of your project:

```bash
# Copy the example
cp .env.example .env

# Edit .env with your actual Twilio credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important**: Never commit `.env` to version control. Add it to `.gitignore`.

### 3. Install Dependencies

The Twilio package is already included in your `package.json`:

```bash
npm install
```

## Architecture

### Twilio Service (`server/twilio.ts`)

The `twilio.ts` module handles:
- Phone number formatting (converts 10-digit Indian numbers to E.164 format)
- OTP sending via Twilio SMS
- Graceful degradation (development mode logging when credentials missing)
- Error handling and logging

**Key Functions:**
- `sendOtpViaTwilio(mobileNumber, otp)` - Sends OTP via SMS
- `formatPhoneNumber(phoneNumber)` - Converts to E.164 format
- `isOtpExpired(expiresAt)` - Checks OTP expiration

### Notifications Service (`server/notifications.ts`)

The `notifications.ts` module provides:
- OTP notifications
- Message alerts for offline users
- Contact request alerts
- Custom SMS notifications

**Exported Functions:**
- `sendOtpNotification(phoneNumber, otp)`
- `sendMessageAlert(phoneNumber, fromUsername)`
- `sendContactRequestAlert(phoneNumber, fromUsername)`
- `sendCustomNotification(phoneNumber, message)`

### Updated Routes (`server/routes.ts`)

The `/api/auth/send-otp` endpoint now:
1. Generates a random 6-digit OTP
2. Stores it in the database with 5-minute expiration
3. Sends it via Twilio
4. Returns success/error response

## Development Mode

When Twilio credentials are not configured, the system:
- Logs OTPs to the console
- Returns the OTP in the API response (only in development)
- Simulates notifications with console logs

Example console output:
```
📱 [DEV MODE] OTP for +919876543210: 123456
```

## Phone Number Format

The application supports:
- **Indian numbers**: 10-digit format (e.g., `9876543210` → `+919876543210`)
- **International numbers**: Already in E.164 format (e.g., `+1234567890`)

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development mode
}
```

### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "username": "john_doe",
  "mobileNumber": "9876543210",
  "otp": "123456",
  "publicKey": "base64_encoded_public_key"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "mobileNumber": "9876543210",
    "publicKey": "base64_encoded_public_key"
  }
}
```

## Security Best Practices

### ✅ Do's
- Always use HTTPS in production
- Rotate Auth Token regularly
- Store credentials in environment variables only
- Use 5-minute OTP expiration
- Sanitize phone number inputs
- Log only non-sensitive information

### ❌ Don'ts
- Never commit credentials to git
- Don't use hardcoded phone numbers
- Don't log full OTP codes in production
- Don't send OTP via unencrypted channels
- Don't expose Twilio credentials in client code
- Don't accept invalid phone number formats

## Testing

### Development Testing

1. Start the server:
```bash
npm run dev
```

2. Send OTP request:
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

3. Check console for OTP output

### Production Testing

1. Configure real Twilio credentials
2. Test with real phone number
3. Verify SMS arrives within seconds
4. Check Twilio Console logs

## Troubleshooting

### "Twilio credentials not fully configured"
- Ensure `.env` file exists with all required credentials
- Check `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Restart the server after updating `.env`

### "Invalid phone number format"
- Ensure 10-digit format for Indian numbers (no country code)
- Or provide full E.164 format with country code
- Example: `9876543210` or `+919876543210`

### SMS Not Arriving
- Verify Twilio account has active balance
- Check Twilio Console for delivery logs
- Verify recipient phone number is correct
- Check Twilio phone number is verified for that country

### 500 Error on Send OTP
- Check server logs for detailed error
- Verify environment variables are loaded
- Ensure Twilio credentials are valid
- Check network connectivity to Twilio API

## Future Enhancements

1. **Webhook Callbacks**: Receive delivery status from Twilio
2. **Message Templates**: Store SMS templates for different notifications
3. **Rate Limiting**: Prevent OTP spam
4. **Multi-language Support**: Localized OTP messages
5. **Backup OTP Channel**: Email OTP if SMS fails
6. **Twilio Verify Service**: Use Twilio's built-in verification service

## Deployment Checklist

- [ ] Twilio credentials configured in environment
- [ ] `.env` file added to `.gitignore`
- [ ] Production Twilio phone number configured
- [ ] Rate limiting implemented (recommended)
- [ ] Error handling tested
- [ ] Logs checked for sensitive data
- [ ] HTTPS enabled in production
- [ ] Twilio SMS logs monitored

## Support Resources

- [Twilio Documentation](https://www.twilio.com/docs/)
- [Twilio Python/Node SDK](https://www.twilio.com/docs/libraries)
- [Twilio Account Console](https://console.twilio.com/)
- [Twilio SMS Pricing](https://www.twilio.com/sms/pricing)

## Files Modified/Created

1. **`.env.example`** - Environment variables template
2. **`server/twilio.ts`** - Twilio SMS service
3. **`server/notifications.ts`** - Notification orchestration
4. **`server/routes.ts`** - Updated to use Twilio for OTP
5. **`TWILIO_SETUP.md`** - This documentation

---

**Last Updated**: November 14, 2025  
**Version**: 1.0
