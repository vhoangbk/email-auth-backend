# Subscription Feature Implementation - Setup Guide

## ✅ Implementation Completed!

All subscription management code has been successfully implemented. Here's what was added:

### 📦 Files Created/Modified

**Database Schema:**
- ✅ `prisma/schema.prisma` - Added SubscriptionPlan, Subscription, Invoice models
- ✅ `prisma/seed.ts` - Seed script for subscription plans

**Type Definitions:**
- ✅ `types/subscription.ts` - TypeScript types for subscriptions

**Libraries:**
- ✅ `lib/stripe.ts` - Stripe client and helper functions
- ✅ `lib/subscription.ts` - Subscription helper functions

**API Routes:**
- ✅ `app/api/subscriptions/plans/route.ts` - Get all plans
- ✅ `app/api/subscriptions/checkout/route.ts` - Create checkout session
- ✅ `app/api/subscriptions/current/route.ts` - Get current subscription
- ✅ `app/api/subscriptions/upgrade/route.ts` - Upgrade/downgrade
- ✅ `app/api/subscriptions/cancel/route.ts` - Cancel subscription
- ✅ `app/api/subscriptions/portal/route.ts` - Billing portal
- ✅ `app/api/subscriptions/invoices/route.ts` - Invoice history
- ✅ `app/api/webhooks/stripe/route.ts` - Stripe webhook handler

**Documentation:**
- ✅ `README.md` - Updated with subscription documentation
- ✅ `.env` - Added Stripe environment variables

---

## 🚀 Next Steps to Complete Setup

### Step 1: Setup Database (MySQL Required)

**You need MySQL running to proceed. Choose one option:**

#### Option A: Docker (Recommended)
```bash
# Run MySQL container
docker run --name email-auth-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=email_auth \
  -p 3306:3306 \
  -d mysql:8.0

# Verify it's running
docker ps
```

#### Option B: Install MySQL via Homebrew
```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE email_auth;"
```

#### Option C: Use SQLite (Testing Only)
If you just want to test without MySQL:

1. Update `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

---

### Step 2: Run Database Migration

Once MySQL is running:

```bash
# Generate Prisma Client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_subscriptions

# Seed subscription plans
npx prisma db seed
```

Expected output:
```
✅ Free Plan created
✅ Pro Monthly Plan created
✅ Pro Yearly Plan created
✅ Premium Monthly Plan created
✅ Premium Yearly Plan created
✅ Database seeding completed!
```

---

### Step 3: Setup Stripe Account

1. **Sign up at [stripe.com](https://stripe.com)**

2. **Get API Keys**
   - Dashboard → Developers → API keys
   - Copy **Secret key** and **Publishable key**

3. **Create Products & Prices**
   - Dashboard → Products → Add Product
   - Create these products:

   **Pro Plan:**
   - Name: "Pro Plan"
   - Create 2 prices:
     - Monthly: $29.99/month (recurring)
     - Yearly: $299.99/year (recurring)

   **Premium Plan:**
   - Name: "Premium Plan"
   - Create 2 prices:
     - Monthly: $99.99/month (recurring)
     - Yearly: $999.99/year (recurring)

4. **Copy Price IDs**
   - Each price has an ID like `price_1Abc...`
   - Copy all 4 Price IDs

5. **Update `.env` with real Stripe values:**
   ```env
   STRIPE_SECRET_KEY="sk_test_your_actual_key"
   STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_key"
   STRIPE_PRICE_ID_PRO_MONTHLY="price_actual_id"
   STRIPE_PRICE_ID_PRO_YEARLY="price_actual_id"
   STRIPE_PRICE_ID_PREMIUM_MONTHLY="price_actual_id"
   STRIPE_PRICE_ID_PREMIUM_YEARLY="price_actual_id"
   ```

---

### Step 4: Setup Stripe Webhooks

#### For Development (Local):

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy webhook secret** from output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

5. **Update `.env`:**
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

#### For Production:

1. Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret to production `.env`

---

### Step 5: Update Seed Data with Real Stripe Price IDs

Edit `prisma/seed.ts` and update the `stripePriceId` fields with your actual Stripe Price IDs.

Then re-run seed:
```bash
npx prisma db seed
```

---

### Step 6: Test the Implementation

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test API endpoints:**

   ```bash
   # Get subscription plans (public)
   curl http://localhost:3000/api/subscriptions/plans
   
   # Register a user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
   
   # Login to get token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456"}'
   
   # Get current subscription (use token from login)
   curl http://localhost:3000/api/subscriptions/current \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Create checkout session
   curl -X POST http://localhost:3000/api/subscriptions/checkout \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"priceId":"price_your_pro_monthly_id"}'
   ```

3. **Test webhook events:**
   ```bash
   # In another terminal (with Stripe CLI listening)
   stripe trigger checkout.session.completed
   stripe trigger invoice.paid
   ```

4. **Open Prisma Studio to check data:**
   ```bash
   npx prisma studio
   ```

---

## 🎯 Feature Highlights

### What You Can Do Now:

✅ **Subscription Plans:** 3 tiers (Free, Pro, Premium)
✅ **Billing Cycles:** Monthly and Yearly options
✅ **Free Trial:** 14 days for paid plans
✅ **Checkout:** Stripe-hosted checkout pages
✅ **Upgrade/Downgrade:** Seamless plan changes with prorated billing
✅ **Cancellation:** Cancel immediately or at period end
✅ **Billing Portal:** Let users manage payment methods
✅ **Invoice History:** Track all payments
✅ **Webhooks:** Automatic processing of Stripe events
✅ **Email Notifications:** Subscription events sent via email
✅ **Feature Gating:** Restrict features by subscription tier

### Subscription Helper Functions:

```typescript
import { 
  getUserSubscriptionTier,
  canAccessFeature,
  requireSubscriptionTier,
  getSubscriptionLimits 
} from '@/lib/subscription'

// Check user's tier
const tier = await getUserSubscriptionTier(userId) // FREE | PRO | PREMIUM

// Check feature access
const hasApi = await canAccessFeature(userId, 'api_access')

// Require minimum tier (throws error if insufficient)
await requireSubscriptionTier(userId, SubscriptionTier.PRO)

// Get usage limits
const limits = await getSubscriptionLimits(userId)
// { maxProjects: 20, maxUsers: 5, maxStorageGB: 50, ... }
```

---

## 📊 Database Schema Summary

### New Tables:
- `subscription_plans` - Available subscription plans
- `subscriptions` - User subscriptions
- `invoices` - Payment history

### Updated Tables:
- `users` - Added `stripeCustomerId`, `currentSubscriptionId`

---

## 🔒 Security Notes

- ✅ All subscription endpoints are protected (require JWT token)
- ✅ Webhook signature verification prevents unauthorized events
- ✅ Stripe handles PCI compliance (no card data touches your server)
- ✅ Trial periods prevent payment until trial ends
- ✅ Cancellation at period end ensures no refund issues

---

## 🐛 Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing Prisma types:
```bash
npx prisma generate
```

### Webhook Not Receiving Events

- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook secret in `.env`
- Check terminal logs for webhook delivery

### Checkout Session Not Creating

- Verify Stripe Price IDs are correct
- Check user has email verified
- Ensure `PUBLIC_APP_URL` is set in `.env`

### Database Connection Failed

- MySQL must be running on port 3306
- Check `DATABASE_URL` in `.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

---

## 📝 Next Steps for Production

Before deploying to production:

1. **Switch to live Stripe keys** (remove `sk_test_` and use `sk_live_`)
2. **Setup production webhooks** in Stripe Dashboard
3. **Configure real SMTP** for emails (SendGrid, AWS SES, etc.)
4. **Add rate limiting** to prevent abuse
5. **Setup monitoring** for webhook failures
6. **Add logging** for subscription events
7. **Test payment flows** with real cards
8. **Configure billing portal** branding in Stripe

---

## 🎉 You're Done!

The subscription system is fully implemented. Follow the steps above to complete the setup and start accepting payments!

For questions or issues, check the README.md or review the code in the implemented files.
