# Twilio Integration for Indecryption 2.0

## Quick Start

### 1. Install Twilio SDK
```bash
npm install twilio
```
✅ Already included in `package.json`

### 2. Get Twilio Credentials
1. Visit [https://console.twilio.com](https://console.twilio.com)
2. Sign up or log in
3. Find your credentials:
   - **Account SID** - Top of dashboard
   - **Auth Token** - Next to Account SID
   - **Phone Number** - Create a Twilio phone number

### 3. Set Environment Variables
```bash
# Copy template
cp .env.example .env

# Edit with your credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Start Server
```bash
npm run dev
```

## How It Works

### OTP Flow with Twilio

```
User enters phone number
        ↓
Client sends POST /api/auth/send-otp
        ↓
Server generates 6-digit OTP
        ↓
Server stores OTP in database (5 min expiry)
        ↓
Server calls sendOtpViaTwilio()
        ↓
Twilio SMS API sends SMS
        ↓
User receives OTP on phone
        ↓
User enters OTP in app
        ↓
Server verifies OTP matches
        ↓
User creates account & keys generated
        ↓
Authentication complete
```

### Architecture

**Server-side:**
- `server/twilio.ts` - Twilio SMS client
- `server/notifications.ts` - Notification service
- `server/routes.ts` - API endpoints

**Client-side:**
- `client/src/lib/twilio-config.ts` - Utilities & validation
- `client/src/components/MobileLoginForm.tsx` - Login UI
- `client/src/components/OtpVerification.tsx` - OTP input UI

**Data Flow:**
```
Client → API Request → Express Server → Twilio API → SMS → User Phone
```

## Features

✅ **OTP Generation & Delivery**
- Random 6-digit OTP
- Twilio SMS integration
- 5-minute expiration
- Database persistence

✅ **Phone Number Validation**
- Supports 10-digit Indian numbers
- E.164 format support
- Automatic formatting

✅ **Development Mode**
- OTP logged to console
- OTP returned in API response (dev only)
- No need for real credentials

✅ **Error Handling**
- Graceful degradation
- Detailed error messages
- Rate limiting ready

✅ **Security**
- No plaintext storage
- Private keys never sent to server
- HTTPS ready
- Environment variable protection

## API Reference

### Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210"
  }'
```

**Response (Dev Mode):**
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

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "mobileNumber": "9876543210",
    "publicKey": "base64_encoded_key"
  }
}
```

## Testing Guide

### Test OTP Delivery
1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:5000`
3. Enter valid 10-digit phone number
4. Check console for OTP (dev mode)
5. Or check SMS on phone (if using real credentials)

### Test Phone Number Validation
```javascript
import { validatePhoneNumber } from '@/lib/twilio-config';

validatePhoneNumber('9876543210');      // ✓ true
validatePhoneNumber('+919876543210');   // ✓ true
validatePhoneNumber('123');             // ✗ false
```

### Test OTP Validation
```javascript
import { validateOtp } from '@/lib/twilio-config';

validateOtp('123456');  // ✓ true
validateOtp('12345');   // ✗ false
validateOtp('abcdef');  // ✗ false
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| OTP not sent | Check `.env` has credentials. Restart server. |
| SMS not arriving | Verify phone format. Check Twilio balance. |
| Invalid credentials error | Copy credentials correctly from Twilio Console. |
| Phone validation fails | Use 10-digit or +91xxxxxxxxxx format. |
| Server won't start | Check NODE_ENV, PORT, and dependencies installed. |

## Environment Variables

```bash
# Required for Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Node setup
NODE_ENV=development  # or production
PORT=5000
```

## Security Checklist

- [ ] Never commit `.env` to git
- [ ] Add `.env` to `.gitignore`
- [ ] Use environment variables only
- [ ] Rotate Auth Token monthly
- [ ] Enable 2FA on Twilio account
- [ ] Monitor OTP attempt logs
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Log only non-sensitive info

## Files Structure

```
SecureChatEngine/
├── .env                          # ⚠️ GITIGNORED - Your credentials
├── .env.example                  # Template for .env
├── TWILIO_SETUP.md              # Detailed setup guide
├── server/
│   ├── twilio.ts                # Twilio SMS service
│   ├── notifications.ts         # Notification orchestration
│   ├── routes.ts                # Updated API endpoints
│   └── ...
├── client/
│   └── src/
│       ├── lib/
│       │   └── twilio-config.ts # Client utilities
│       ├── components/
│       │   ├── MobileLoginForm.tsx
│       │   ├── OtpVerification.tsx
│       │   └── ...
│       └── ...
└── package.json                 # Twilio already added
```

## Production Deployment

### Before Going Live
1. Get production Twilio credentials
2. Set all environment variables
3. Enable HTTPS
4. Configure rate limiting
5. Set up error monitoring
6. Test OTP delivery
7. Monitor Twilio usage/costs

### Deployment Steps
```bash
# Build
npm run build

# Deploy
npm run start
```

### Monitor
- Check Twilio Console logs
- Monitor server error logs
- Track OTP delivery rates
- Review authentication metrics

## Cost Considerations

**Twilio Pricing (approximate):**
- Free account: $20 trial credit
- OTP SMS: ~$0.0075 per message
- Incoming SMS: ~$0.0075 per message
- Phone number rental: ~$1/month

**Estimate for 1000 users:**
- OTP sends: 1000 × $0.0075 = $7.50
- Phone: $1/month
- **Monthly: ~$8.50**

## Support & Resources

- 📚 [Twilio Docs](https://www.twilio.com/docs/)
- 🔐 [Security Best Practices](https://www.twilio.com/docs/usage/security)
- 🚀 [Twilio Console](https://console.twilio.com/)
- 💬 [Twilio Support](https://support.twilio.com/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 14, 2025 | Initial Twilio integration |

---

**Built with ❤️ for Indecryption 2.0**
