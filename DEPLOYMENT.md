# 🚀 Deployment Guide - Indecryption 2.0 with Twilio

## Pre-Deployment Checklist

- [ ] Code is committed to git
- [ ] All tests pass: `npm run check`
- [ ] Dependencies installed: `npm install`
- [ ] Build successful: `npm run build`
- [ ] Twilio account created
- [ ] Twilio credentials obtained
- [ ] Production `.env` file prepared
- [ ] HTTPS certificate ready
- [ ] Database configured
- [ ] Error monitoring setup (optional but recommended)

## Environment Setup

### 1. Get Production Twilio Credentials

**Step 1: Sign in to Twilio**
- Go to https://console.twilio.com
- Navigate to Account > Keys & Credentials
- Copy your Account SID
- Copy your Auth Token (keep secret!)

**Step 2: Get Production Phone Number**
- Phone Numbers > Manage Numbers > Active Numbers
- Or buy a new number under Numbers > Buy a Number
- Choose your country and phone number
- Copy the phone number

### 2. Create Production `.env` File

```bash
# On your production server/deployment platform:

# Twilio Credentials (from console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Node Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional: Error Monitoring (Sentry, DataDog, etc.)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**⚠️ SECURITY ALERT:**
- Never commit `.env` to git
- Use deployment platform's secret management
- Rotate credentials monthly
- Enable 2FA on Twilio account

### 3. Configure Your Hosting Platform

#### For Vercel:
```bash
# Add environment variables in Project Settings > Environment Variables
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
NODE_ENV=production
DATABASE_URL=postgresql://...
PORT=5000
```

#### For Heroku:
```bash
# Using Heroku CLI
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
heroku config:set TWILIO_AUTH_TOKEN=your_auth_token_here
heroku config:set TWILIO_PHONE_NUMBER=+1234567890
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=postgresql://...
```

#### For AWS/Docker:
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm ci

# Build
RUN npm run build

# Set environment at runtime
ENV NODE_ENV=production
ENV PORT=5000

# Start
CMD ["npm", "start"]
```

#### For AWS Lambda/Serverless:
```yaml
# serverless.yml
service: indecryption-chat

provider:
  name: aws
  runtime: nodejs18.x
  environment:
    TWILIO_ACCOUNT_SID: ${ssm:/indecryption/twilio/sid}
    TWILIO_AUTH_TOKEN: ${ssm:/indecryption/twilio/token}
    TWILIO_PHONE_NUMBER: ${ssm:/indecryption/twilio/phone}
    NODE_ENV: production

functions:
  api:
    handler: dist/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
```

## Build & Deployment

### Option 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Vercel automatically:
# - Installs dependencies
# - Runs build script
# - Sets environment variables
# - Configures HTTPS
```

### Option 2: Deploy to Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
heroku config:set TWILIO_AUTH_TOKEN=your_auth_token_here
heroku config:set TWILIO_PHONE_NUMBER=+1234567890
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=postgresql://...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 3: Deploy to Your Own Server

```bash
# On production server

# 1. Clone repository
git clone https://github.com/yourusername/SecureChatEngine.git
cd SecureChatEngine

# 2. Install Node.js (if not installed)
# https://nodejs.org/

# 3. Install dependencies
npm ci  # Use ci instead of install for production

# 4. Create .env file
nano .env
# Add all environment variables

# 5. Build
npm run build

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name "indecryption"
pm2 save
pm2 startup

# 7. Configure HTTPS (Let's Encrypt)
# Use certbot or similar for SSL certificates
```

## Post-Deployment Verification

### 1. Check Server Status

```bash
# Test health
curl https://your-domain.com/api/health

# Check logs
# For Vercel: vercel logs
# For Heroku: heroku logs --tail
# For custom: tail /var/log/app.log
```

### 2. Test OTP Delivery

```bash
# Send test OTP
curl -X POST https://your-domain.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'

# Verify response
# Should return: {"success": true, "message": "OTP sent successfully"}
```

### 3. Monitor Twilio Console

1. Go to https://console.twilio.com
2. Check **Logs > Message Logs**
3. Verify OTPs are being delivered
4. Check delivery status and error logs

### 4. Test Full Authentication Flow

1. Open your app: https://your-domain.com
2. Enter phone number
3. Verify OTP received on phone
4. Complete authentication
5. Test real-time chat

## Performance Optimization

### 1. Enable Caching

```bash
# Add to your nginx/server config
Cache-Control: public, max-age=3600
```

### 2. Use CDN

- Cloudflare (free tier available)
- Akamai
- CloudFront
- Bunny CDN

### 3. Database Optimization

```sql
-- Create indexes for faster OTP lookups
CREATE INDEX idx_otp_mobile ON otpcodes(mobile_number);
CREATE INDEX idx_otp_expires ON otpcodes(expires_at);
CREATE INDEX idx_user_mobile ON users(mobile_number);
```

### 4. Monitor Performance

```bash
# Check response times
curl -w "@curl-format.txt" https://your-domain.com

# Monitor with tools like:
# - DataDog
# - New Relic
# - Prometheus
# - CloudWatch
```

## Security Hardening

### 1. Rate Limiting

Add rate limiting middleware (see `server/twilio-enhancements.ts`):

```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.post("/api/auth/send-otp", rateLimitOtp, async (req, res) => {
  // OTP endpoint with tighter rate limiting
});
```

### 2. Enable CORS Properly

```typescript
app.use(cors({
  origin: ['https://your-domain.com', 'https://www.your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST'],
}));
```

### 3. Security Headers

```typescript
app.use(helmet()); // Express middleware for security headers

// Or manually:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 4. HTTPS Configuration

```nginx
# nginx example
server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Redirect HTTP to HTTPS
  location / {
    proxy_pass http://localhost:5000;
  }
}

server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$server_name$request_uri;
}
```

## Monitoring & Maintenance

### 1. Set Up Logging

```typescript
// Add to server/index.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### 2. Monitor Twilio Costs

```bash
# Monthly cost tracking
API Calls × $0.0075 = Total SMS Cost
Example: 10,000 OTP SMS = $75/month
```

Check Twilio Console > Billing > Usage

### 3. Set Up Alerts

**Twilio Alerts:**
- SMS delivery failures
- Account balance low
- Unusual usage patterns

**Application Alerts:**
- Server downtime
- High error rates
- Failed OTP attempts
- Database issues

### 4. Regular Maintenance

```bash
# Weekly
npm audit  # Check for vulnerabilities
npm update # Update dependencies

# Monthly
# - Review Twilio logs
# - Check performance metrics
# - Rotate credentials
# - Review security logs

# Quarterly
# - Full security audit
# - Database optimization
# - Load testing
# - Disaster recovery drill
```

## Troubleshooting Production Issues

### Issue: OTP not sending

**Check:**
```bash
# 1. Verify credentials in environment
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# 2. Check Twilio console logs
# 3. Verify phone number format
# 4. Check Twilio account balance
# 5. Review server logs for errors
```

### Issue: High latency

**Solutions:**
- Enable CDN caching
- Optimize database queries
- Add more server replicas
- Check Twilio API response times

### Issue: Database errors

**Solutions:**
```bash
# Check connection
psql -U user -h host -d database

# Monitor connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

# Kill stuck connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'your_database' AND pid <> pg_backend_pid();
```

## Rollback Procedure

If something goes wrong:

```bash
# Heroku
heroku releases
heroku rollback v12  # Rollback to specific version

# Git-based
git log --oneline
git revert <commit-hash>
git push

# Docker
docker rollback --from production:v2.0 --to production:v1.9

# Manual
# Stop application
# Restore previous version
# Restart application
```

## Scaling Considerations

### Horizontal Scaling

```bash
# Add more server instances
# Load balance with nginx/HAProxy
# Use sticky sessions for WebSocket

upstream backend {
  server server1.example.com:5000;
  server server2.example.com:5000;
  server server3.example.com:5000;
}
```

### Database Scaling

```bash
# For high load:
# - Read replicas
# - Connection pooling (PgBouncer)
# - Query optimization
# - Archive old OTP records
```

### WebSocket Scaling

```typescript
// Use Redis adapter for Socket.IO
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient();
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

## Compliance & Legal

- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if US users)
- [ ] Data retention policy (delete old OTPs)
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] SMS consent compliance

## Cost Estimation

```
Monthly Costs:

Infrastructure:
- Hosting: $20-100/month (Vercel, Heroku, AWS)
- Database: $10-50/month (PostgreSQL)
- CDN: $0-20/month (Cloudflare)

Twilio:
- Phone number: $1/month
- SMS: $0.0075 per message
- Example: 10,000 users × 1 OTP = $75/month

Monitoring:
- Error tracking: $0-29/month (Sentry)
- APM: $0-199/month (DataDog)

Total: ~$100-300/month for startup scale
```

## Support & Resources

- 📚 [Twilio Docs](https://www.twilio.com/docs/)
- 🚀 [Deployment Guides](https://www.twilio.com/docs/usage/deployment)
- 🔐 [Security](https://www.twilio.com/docs/usage/security)
- 💬 [Support](https://support.twilio.com/)

---

## ✅ Deployment Checklist (Final)

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Rate limiting enabled
- [ ] Error monitoring setup
- [ ] Database configured
- [ ] OTP delivery tested
- [ ] Full auth flow tested
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Monitoring configured
- [ ] Backup plan ready
- [ ] Documentation updated
- [ ] Team trained
- [ ] Go-live approved

---

**You're ready to deploy! 🎉**

Need help? Check [TWILIO_SETUP.md](./TWILIO_SETUP.md) or [TWILIO_README.md](./TWILIO_README.md)
