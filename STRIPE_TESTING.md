# Stripe Payment Testing Guide

## Overview
Your Stripe payment integration is now fully configured and working!

## Current Setup

### Stripe Account
- Account ID: `acct_1T0wIJAZqXIKHL5D`
- Email: vhoangbk@gmail.com

### Subscription Plans & Price IDs

| Plan | Interval | Price | Stripe Price ID |
|------|----------|-------|----------------|
| Free Plan | Lifetime | $0 | `null` (no Stripe price) |
| Pro Plan | Monthly | $29.99 | `price_1T118dAZqXIKHL5D3lOE7fJJ` |
| Pro Plan | Yearly | $299.99 | `price_1T119bAZqXIKHL5DEiMLC7mZ` |
| Premium Plan | Monthly | $99.99 | `price_1T11BUAZqXIKHL5DcgqO7Sq8` |
| Premium Plan | Yearly | $999.99 | `price_1T11BUAZqXIKHL5DV3q5Q9JX` |

All paid plans include a **14-day free trial**.

## Testing Payment Flow

### 1. Start Webhook Listener

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

Keep this running in a separate terminal. This forwards Stripe events to your local webhook endpoint.

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Complete Flow

#### Option A: Using cURL (Command Line)

```bash
# Step 1: Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Test1234!",
    "name": "Test Customer"
  }'

# Step 2: Verify the user (manual - update database)
# Or use the verification token from email

# Step 3: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Test1234!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# Step 4: Get available plans
curl http://localhost:3000/api/subscriptions/plans | jq '.[] | {name, displayName, price, stripePriceId}'

# Step 5: Create checkout session (Pro Monthly example)
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"priceId": "price_1T118dAZqXIKHL5D3lOE7fJJ"}' | jq '.'
```

This will return a `url` field - open it in your browser to complete payment.

#### Option B: Using Your Frontend

If you have a frontend, the flow is:
1. User registers/logs in
2. User selects a plan
3. Frontend calls `POST /api/subscriptions/checkout` with the plan's `stripePriceId`
4. Frontend redirects user to the returned `url`
5. User completes payment in Stripe Checkout
6. Stripe sends webhooks to create the subscription in your database

### 4. Test Payment with Stripe Test Cards

When you reach the Stripe Checkout page, use these test cards:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Other Test Scenarios:**
- **Requires 3D Secure:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`

Full list: https://stripe.com/docs/testing#cards

### 5. Verify Subscription Created

After successful payment, check your database:

```bash
# Check subscriptions table
npx prisma studio
```

You should see:
- User's `stripeCustomerId` populated
- User's `currentSubscriptionId` populated
- New record in `subscriptions` table with status `TRIALING` or `ACTIVE`
- New record in `invoices` table (if payment was processed)

## Webhook Events

Your webhook handler processes these events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Updates user's Stripe customer ID |
| `customer.subscription.created` | Creates subscription record in database |
| `customer.subscription.updated` | Updates subscription status, renewal dates |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.paid` | Creates invoice record, sends receipt email |
| `invoice.payment_failed` | Updates subscription to PAST_DUE, sends notification |

## Important Notes

### Webhook Signature Verification
- **Development:** The webhook handler skips signature verification when `NODE_ENV=development` and no signature is present
- **Production:** ALWAYS set `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard → Webhooks

### Environment Variables Required

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # Get from Stripe Dashboard
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your production URL
```

### Trial Period
All paid plans have a 14-day trial. During trial:
- Status will be `TRIALING`
- No payment is collected immediately
- After 14 days, first payment is automatically charged

## Troubleshooting

### Checkout session fails with "No such price"
- Verify price IDs in database match your Stripe account
- Run: `stripe prices list` to see available prices
- Check you're using the correct Stripe API key

### Webhook not creating subscription
- Ensure `stripe listen` is running
- Check webhook endpoint is accessible: `curl http://localhost:3000/api/webhooks/stripe`
- Check server logs for webhook processing errors
- Verify user has `stripeCustomerId` set before subscription creation

### "Invalid subscription plan" error
- The `priceId` you're sending doesn't exist in your `subscription_plans` table
- Run: `curl http://localhost:3000/api/subscriptions/plans` to see valid price IDs

## Production Deployment

Before deploying to production:

1. **Create production webhook in Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

2. **Update environment variables:**
   - Set `NODE_ENV=production`
   - Set `NEXT_PUBLIC_APP_URL` to your production URL
   - Use production Stripe keys (start with `sk_live_` and `pk_live_`)

3. **Remove development webhook bypass:**
   - In production, webhook signature verification is ALWAYS enforced

4. **Test thoroughly:**
   - Test successful payment
   - Test failed payment
   - Test subscription renewal (use Stripe test clocks)
   - Test cancellation flow

## Useful Commands

```bash
# List Stripe prices
stripe prices list

# View Stripe events
stripe events list --limit 20

# Trigger test webhook
stripe trigger customer.subscription.created

# View Stripe logs
stripe logs tail

# View subscription
stripe subscriptions retrieve sub_xxxxx

# Cancel subscription
stripe subscriptions cancel sub_xxxxx
```

---

**Your Stripe integration is ready to use!** 🎉
