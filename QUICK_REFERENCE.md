# Quick Reference Card - Twilio Integration

## 🚀 Get Started in 5 Minutes

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your Twilio credentials to .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# 3. Install dependencies (if not already done)
npm install

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:5000
```

## 📱 Phone Number Format

| Format | Example | Works? |
|--------|---------|--------|
| 10-digit (India) | `9876543210` | ✅ Yes |
| E.164 with +91 | `+919876543210` | ✅ Yes |
| E.164 other | `+14155552671` | ✅ Yes |
| With spaces | `98 765 43210` | ✅ Yes (auto-clean) |
| Invalid | `123` | ❌ No |

## 🔐 Environment Variables

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Optional
NODE_ENV=development              # or 'production'
PORT=5000                         # Server port
DATABASE_URL=postgresql://...     # Database connection
```

## 🧪 Development Mode

When Twilio credentials are **NOT** configured:
- ✓ OTP is logged to console
- ✓ OTP is returned in API response
- ✓ No SMS sent
- ✓ Perfect for testing

Console output:
```
📱 [DEV MODE] OTP for +919876543210: 123456
```

## 🔧 Key Functions

### Server-side (`server/twilio.ts`)
```typescript
// Send OTP via SMS
await sendOtpViaTwilio('9876543210', '123456');

// Check if OTP expired
isOtpExpired(expiresAt); // boolean

// Format phone number
formatPhoneNumber('9876543210'); // '+919876543210'
```

### Client-side (`client/src/lib/twilio-config.ts`)
```typescript
// Validate phone number
validatePhoneNumber('9876543210'); // true

// Validate OTP
validateOtp('123456'); // true

// Format for display
formatPhoneNumberForDisplay('9876543210'); // '+91 98765 43210'

// Check rate limits
otpTracker.recordAttempt(); // true/false
```

## 📡 API Reference

### Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

**Response (Dev):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

**Response (Prod):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "mobileNumber": "9876543210",
    "otp": "123456",
    "publicKey": "base64_encoded_key"
  }'
```

## 🎨 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MobileLoginForm` | `client/src/components/` | Phone input screen |
| `OtpVerification` | `client/src/components/` | OTP input screen |
| `AuthAlert` | `client/src/components/` | Alert messages |
| Twilio Service | `server/twilio.ts` | SMS delivery |
| Notifications | `server/notifications.ts` | Alert orchestration |

## 🔍 Debugging

### Check server logs
```bash
# Watch for OTP logs
npm run dev
# Look for: 📱 [DEV MODE] OTP for ...
```

### Test phone validation
```javascript
import { validatePhoneNumber } from '@/lib/twilio-config';
console.log(validatePhoneNumber('9876543210')); // true
```

### Check environment
```javascript
console.log(process.env.TWILIO_ACCOUNT_SID); // Should show SID
```

## 🚨 Common Issues

| Problem | Quick Fix |
|---------|-----------|
| `.env` not found | `cp .env.example .env` |
| OTP not logging | Restart server after editing `.env` |
| Phone validation fails | Use 10-digit (9876543210) format |
| Server won't start | Check PORT isn't in use: `netstat -ano` |
| SMS not arriving | Check Twilio console for errors |
| Build errors | Run `npm install` then `npm run check` |

## 💰 Costs

- **Free account**: $20 trial credit
- **OTP SMS**: ~$0.0075 per message
- **Phone number**: ~$1.00/month
- **1000 users/month**: ~$8.50

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment template |
| `TWILIO_SETUP.md` | Detailed setup guide |
| `TWILIO_README.md` | Complete reference |
| `IMPLEMENTATION_SUMMARY.md` | What was built |
| `server/twilio-enhancements.ts` | Future features |

## 🎯 Next Steps

1. ✅ Configure `.env` with Twilio credentials
2. ✅ Test OTP with valid phone number
3. ✅ Test in production mode
4. ✅ Add rate limiting (see `twilio-enhancements.ts`)
5. ✅ Set up error monitoring

## 🔗 Resources

- [Get Twilio Account](https://www.twilio.com/console)
- [Twilio Docs](https://www.twilio.com/docs/)
- [Support](https://support.twilio.com/)

## ✨ Features at a Glance

| Feature | Status |
|---------|--------|
| OTP Generation | ✅ Done |
| SMS Delivery | ✅ Done |
| Phone Validation | ✅ Done |
| OTP Verification | ✅ Done |
| Rate Limiting | 📋 Example provided |
| Multi-channel | 📋 Example provided |
| Webhooks | 📋 Example provided |
| Analytics | 📋 Example provided |

---

**Last Updated**: November 14, 2025  
**Version**: 1.0
