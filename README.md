# Email Authentication System - Backend

A secure email-based authentication system built with Next.js, TypeScript, Prisma, and MySQL.

## Features

- ✅ User registration with email verification
- ✅ Secure login with JWT tokens
- ✅ Password reset functionality
- ✅ Protected API routes
- ✅ User profile management
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

## Prerequisites

- Node.js 18+ installed
- MySQL database running
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
│   │   └── user/
│   │       └── profile/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── email.ts         # Email sending functions
│   └── prisma.ts        # Prisma client singleton
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── types/
│   └── auth.ts          # TypeScript type definitions
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
