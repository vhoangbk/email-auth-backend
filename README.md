# Email Authentication System - Backend

A secure email-based authentication system with subscription management built with Next.js, TypeScript, Prisma, and MySQL.

## Features

- ✅ User registration with email verification
- ✅ Secure login with JWT tokens
- ✅ Password reset functionality
- ✅ Protected API routes
- ✅ User profile management
- ✅ **Subscription management with Stripe**
- ✅ **Multiple pricing tiers (Free, Pro, Premium)**
- ✅ **Monthly and yearly billing cycles**
- ✅ **14-day free trial for paid plans**
- ✅ **Subscription upgrade/downgrade**
- ✅ **Billing portal integration**
- ✅ **Invoice history and receipts**
- ✅ **Webhook handling for payment events**
- ✅ Email notifications
- ✅ TypeScript for type safety
- ✅ Prisma ORM for database management
- ✅ Security headers and best practices

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **Payments**: Stripe

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Stripe account (for subscription features)
- SMTP email server credentials (Gmail, SendGrid, etc.)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database connection
DATABASE_URL="mysql://username:password@localhost:3306/email_auth"

# JWT secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**Note for Gmail users**: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### 3. Setup Database

Generate Prisma Client:
```bash
npx prisma generate
```

Create database tables:
```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the API homepage.

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true
  }
}
```

#### Verify Email
```http
GET /api/auth/verify?token=VERIFICATION_TOKEN
```

#### Request Password Reset
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
PUT /api/auth/reset-password
Content-Type: application/json

{
  "token": "RESET_TOKEN",
  "newPassword": "NewSecurePass123"
}
```

### User Profile (Protected)

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

## Subscription Management

The system includes a complete subscription management solution powered by Stripe, supporting multiple tiers, billing cycles, and advanced features.

### Subscription Tiers

#### Free Plan
- **Price**: $0 (Lifetime free)
- **Features**:
  - 3 projects maximum
  - 1 user
  - 1GB storage
  - Basic features

#### Pro Plan
- **Monthly**: $29.99/month
- **Yearly**: $299.99/year (save 17%)
- **Features**:
  - 20 projects
  - 5 users
  - 50GB storage
  - API access
  - Priority support
  - Advanced analytics
  - 14-day free trial

#### Premium Plan
- **Monthly**: $99.99/month
- **Yearly**: $999.99/year (save 17%)
- **Features**:
  - Unlimited projects
  - Unlimited users
  - 500GB storage
  - Full API access
  - Priority support
  - Custom domain
  - Advanced analytics
  - White-label options
  - Dedicated support
  - 14-day free trial

### Subscription API Endpoints

#### Get All Plans (Public)
```http
GET /api/subscriptions/plans
```

Response:
```json
[
  {
    "id": "clx123...",
    "name": "PRO_MONTHLY",
    "displayName": "Pro Plan (Monthly)",
    "price": 29.99,
    "interval": "monthly",
    "features": {...},
    "stripePriceId": "price_xxx",
    "trialDays": 14
  }
]
```

#### Create Checkout Session (Protected)
```http
POST /api/subscriptions/checkout
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "priceId": "price_xxx",
  "billingInterval": "monthly"
}
```

Response:
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx"
}
```

#### Get Current Subscription (Protected)
```http
GET /api/subscriptions/current
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "subscription": {
    "id": "clx123...",
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-03-15T00:00:00.000Z",
    "plan": {
      "name": "PRO_MONTHLY",
      "displayName": "Pro Plan (Monthly)",
      "price": 29.99
    }
  },
  "usage": {
    "remainingTrialDays": 7,
    "daysUntilRenewal": 23
  }
}
```

#### Upgrade/Downgrade Subscription (Protected)
```http
POST /api/subscriptions/upgrade
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "newPriceId": "price_new_plan"
}
```

#### Cancel Subscription (Protected)
```http
POST /api/subscriptions/cancel
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "immediate": false
}
```

Note: Set `immediate: true` to cancel immediately, or `false` (default) to cancel at period end.

#### Get Billing Portal (Protected)
```http
POST /api/subscriptions/portal
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

#### Get Invoice History (Protected)
```http
GET /api/subscriptions/invoices?limit=10&page=1
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "invoices": [...],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Stripe Setup

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Get your API keys from Dashboard

2. **Create Products and Prices**
   - Go to Stripe Dashboard → Products
   - Create products for Pro and Premium plans
   - Create prices for monthly and yearly billing
   - Copy the Price IDs

3. **Configure Environment Variables**
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   
   # Update these with actual Stripe Price IDs
   STRIPE_PRICE_ID_PRO_MONTHLY="price_xxx"
   STRIPE_PRICE_ID_PRO_YEARLY="price_xxx"
   STRIPE_PRICE_ID_PREMIUM_MONTHLY="price_xxx"
   STRIPE_PRICE_ID_PREMIUM_YEARLY="price_xxx"
   ```

4. **Setup Webhook**
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Login: `stripe login`
   - Forward webhooks (development):
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - Copy the webhook secret to `.env`

5. **Run Migration and Seed**
   ```bash
   # Create subscription tables
   npx prisma migrate dev --name add_subscriptions
   
   # Seed subscription plans
   npx prisma db seed
   ```

### Webhook Events Handled

The system handles these Stripe webhook events:

- `checkout.session.completed` - New subscription created
- `customer.subscription.created` - Initial subscription setup
- `customer.subscription.updated` - Plan changes, renewals
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Successful payment, create invoice record
- `invoice.payment_failed` - Payment failed, notify user

### Feature Gating Example

Use subscription helpers to restrict features:

```typescript
import { requireSubscriptionTier, canAccessFeature } from '@/lib/subscription'
import { SubscriptionTier } from '@/types/subscription'

// In your API route
export async function POST(request: NextRequest) {
  const payload = verifyToken(token)
  
  // Require Pro or higher
  await requireSubscriptionTier(payload.userId, SubscriptionTier.PRO)
  
  // Or check specific feature
  const hasAccess = await canAccessFeature(payload.userId, 'api_access')
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'This feature requires a Pro subscription' },
      { status: 403 }
    )
  }
  
  // Continue with protected feature...
}
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Database Schema

### User Model
- `id`: Unique identifier (CUID)
- `email`: Unique email address
- `hashedPassword`: Bcrypt hashed password
- `name`: Optional user name
- `isVerified`: Email verification status
- `stripeCustomerId`: Stripe customer ID
- `currentSubscriptionId`: Current active subscription
- `createdAt`: Registration timestamp
- `updatedAt`: Last update timestamp

### VerificationToken Model
- `id`: Unique identifier
- `token`: Verification token
- `userId`: Foreign key to User
- `expiresAt`: Token expiration (24 hours)

### PasswordReset Model
- `id`: Unique identifier
- `token`: Reset token
- `userId`: Foreign key to User
- `expiresAt`: Token expiration (1 hour)
- `isUsed`: Whether token has been used

### SubscriptionPlan Model
- `id`: Unique identifier
- `name`: Plan name (FREE, PRO_MONTHLY, etc.)
- `displayName`: Human-readable plan name
- `stripePriceId`: Stripe Price ID
- `price`: Plan price
- `interval`: Billing interval (monthly, yearly, lifetime)
- `features`: JSON object with plan features
- `isActive`: Whether plan is available
- `trialDays`: Free trial duration in days

### Subscription Model
- `id`: Unique identifier
- `userId`: Foreign key to User
- `planId`: Foreign key to SubscriptionPlan
- `stripeSubscriptionId`: Stripe subscription ID
- `status`: Subscription status (ACTIVE, CANCELED, PAST_DUE, etc.)
- `currentPeriodStart`: Current billing period start
- `currentPeriodEnd`: Current billing period end
- `cancelAtPeriodEnd`: Whether subscription cancels at period end
- `trialStart`: Trial start date
- `trialEnd`: Trial end date

### Invoice Model
- `id`: Unique identifier
- `userId`: Foreign key to User
- `subscriptionId`: Foreign key to Subscription
- `stripeInvoiceId`: Stripe invoice ID
- `amount`: Invoice amount
- `currency`: Currency code (usd, etc.)
- `status`: Invoice status (PAID, OPEN, etc.)
- `invoiceUrl`: Stripe hosted invoice URL
- `paidAt`: Payment timestamp

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── verify/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── subscriptions/
│   │   │   ├── plans/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── current/route.ts
│   │   │   ├── upgrade/route.ts
│   │   │   ├── cancel/route.ts
│   │   │   ├── portal/route.ts
│   │   │   └── invoices/route.ts
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── user/
│   │       └── profile/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── email.ts         # Email sending functions
│   ├── prisma.ts        # Prisma client singleton
│   ├── stripe.ts        # Stripe client and helpers
│   └── subscription.ts  # Subscription helper functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Database seeding script
│   └── migrations/      # Migration files
├── types/
│   ├── auth.ts          # Authentication type definitions
│   └── subscription.ts  # Subscription type definitions
├── middleware.ts        # Authentication middleware
├── .env.example         # Environment variables template
├── AGENTS.md           # Guide for AI coding agents
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Email verification required before login
- ✅ Secure password reset flow
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Input validation and sanitization
- ✅ Protected API routes with middleware

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm run start
```

## Testing the API

You can test the API using:
- **curl** - Command line
- **Postman** - GUI client
- **Thunder Client** - VS Code extension
- **Insomnia** - API client

Example with curl:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Get Profile (use token from login)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists: `CREATE DATABASE email_auth;`

### Email Not Sending
- Check SMTP credentials
- For Gmail, use App Password
- Check firewall/network settings
- Review console logs for email errors

### JWT Token Issues
- Ensure JWT_SECRET is set in `.env`
- Check token expiration (7 days default)
- Verify Authorization header format: `Bearer TOKEN`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on the repository.
