# Aikeedo Next.js - Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup (Supabase)

**Create Production Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key

**Run Migrations:**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Configure Auth:**
1. Go to Authentication → Settings
2. Set Site URL: `https://yourdomain.com`
3. Add Redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/auth/confirm`
4. Configure email templates (optional)

**Set up Storage:**
1. Go to Storage
2. Create buckets:
   - `avatars` (public)
   - `images` (public)
   - `audio` (public)
3. Set up RLS policies (already in migrations)

---

### 2. Vercel Deployment

**Connect Repository:**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Framework: Next.js (auto-detected)

**Environment Variables:**
Add the following in Vercel → Settings → Environment Variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_string

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Nusanexus

# Monitoring (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ENCRYPTION_KEY=your_32_byte_hex_string

NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Nusanexus

# Monitoring (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Deploy:**
```bash
# Automatic deployment on git push
git push origin main

# Or manual deployment
vercel --prod
```

---

### 3. Custom Domain Setup

**In Vercel:**
1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**DNS Configuration:**
Add these records to your domain:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

### 4. Payment Gateway Configuration

**Tripay Setup:**
1. Login to admin panel: `/admin/payment-gateways`
2. Click "Add Gateway"
3. Select "Tripay"
4. Enter credentials:
   - API Key (from Tripay dashboard)
   - Private Key
   - Merchant Code
5. Toggle Sandbox OFF for production
6. Test connection

**Configure Webhook:**
1. Go to Tripay Dashboard → Settings → Callback
2. Set Callback URL: `https://yourdomain.com/api/webhooks/tripay`
3. Save

**Midtrans Setup:**
1. Login to admin panel: `/admin/payment-gateways`
2. Click "Add Gateway"
3. Select "Midtrans"
4. Enter credentials:
   - Server Key (from Midtrans dashboard)
   - Client Key
5. Toggle Sandbox OFF for production
6. Test connection

**Configure Webhook:**
1. Go to Midtrans Dashboard → Settings → Configuration
2. Set Notification URL: `https://yourdomain.com/api/webhooks/midtrans`
3. Save

---

### 5. AI Provider Configuration

**Add AI Providers:**
1. Login as admin
2. Go to `/admin/providers`
3. Add providers:
   - OpenAI (for GPT-4, DALL-E 3, TTS, Whisper)
   - OpenRouter (optional, for multiple models)
   - Together AI (optional)
   - Writer (optional)
4. Enter API keys (stored encrypted)
5. Sync models

---

### 6. System Settings

**Configure Site:**
1. Go to `/admin/settings`
2. Set:
   - Site Name
   - Site Logo URL
3. Configure SMTP (for emails):
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (587)
   - SMTP Username
   - SMTP Password
4. Enable/disable features as needed
5. Save changes

---

### 7. Testing

**Critical Path Testing:**
1. **Signup Flow:**
   - Create new account
   - Verify email
   - Login

2. **Workspace:**
   - Create workspace
   - Invite member
   - Accept invitation

3. **AI Generation:**
   - Configure AI provider
   - Generate text (AI Writer)
   - Generate image (Image Generator)
   - Verify credit deduction

4. **Payment Flow:**
   - Subscribe to Starter plan
   - Complete payment via Tripay
   - Verify subscription active
   - Verify credits allocated

5. **Credit Purchase:**
   - Purchase credit package
   - Complete payment via Midtrans
   - Verify credits added

**Admin Testing:**
1. Access admin dashboard
2. View revenue stats
3. Manage users
4. Monitor transactions
5. Update system settings

---

### 8. Monitoring Setup

**Error Tracking (Sentry):**

Sentry SDK is already integrated in the codebase (`@sentry/nextjs` with
`sentry.client.config.ts` and `sentry.server.config.ts`).

To enable it in production:

1. Set these environment variables in Vercel:
   - `SENTRY_DSN`
   - `SENTRY_ENVIRONMENT` (e.g. `production`)
2. Deploy the app – errors from API routes and pages will be sent to Sentry.

**Uptime Monitoring:**
1. Sign up for [UptimeRobot](https://uptimerobot.com)
2. Add monitor for `https://yourdomain.com`
3. Set alert email

**Analytics:**
- Vercel Analytics (automatic)
- Or add Google Analytics

---

### 9. Backup & Recovery

**Database Backups:**
1. Supabase automatically backs up daily
2. Enable Point-in-Time Recovery (PITR) in Supabase dashboard
3. Test restore procedure

**Storage Backups:**
- Supabase Storage is automatically backed up
- Consider additional backup to S3 for critical files

---

### 10. Security Checklist

- [ ] All RLS policies active
- [ ] API routes require authentication
- [ ] Webhook signatures verified
- [ ] Encryption keys strong and secure
- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting configured (Upstash Redis + middleware)

---

## Post-Deployment

### Monitoring
- Check error logs daily (Sentry)
- Monitor uptime (UptimeRobot)
- Review transaction logs
- Check credit usage patterns

### Maintenance
- Update dependencies monthly
- Review and optimize database queries
- Monitor storage usage
- Review user feedback

### Scaling
- Upgrade Supabase plan if needed
- Optimize images and assets
- Implement caching strategies
- Consider CDN for static assets

---

## Rollback Plan

If issues occur:

1. **Vercel:**
   - Go to Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Database:**
   - Use Supabase PITR to restore
   - Or restore from backup

3. **Emergency:**
   - Enable maintenance mode in admin settings
   - Fix issues
   - Disable maintenance mode

---

## Support

**Documentation:**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tripay Docs](https://tripay.co.id/developer)
- [Midtrans Docs](https://docs.midtrans.com)

**Common Issues:**
- Email not sending → Check SMTP settings
- Payment webhook not working → Verify webhook URLs
- AI generation failing → Check provider API keys
- RLS errors → Review policies in Supabase

---

## Production URLs

- **App**: https://yourdomain.com
- **Admin**: https://yourdomain.com/admin/dashboard
- **API**: https://yourdomain.com/api
- **Webhooks**:
  - Tripay: https://yourdomain.com/api/webhooks/tripay
  - Midtrans: https://yourdomain.com/api/webhooks/midtrans

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Version:** 1.0.0
