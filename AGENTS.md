# AGENTS.md - Email Authentication System Backend

This guide is for AI coding agents working on this Next.js + TypeScript + Prisma + MySQL email authentication backend.

## Project Overview

**Tech Stack:** Next.js 14+, TypeScript, Prisma ORM, MySQL, Node.js
**Purpose:** Email-based authentication system with secure user management

---

## Build, Lint & Test Commands

### Development
```bash
npm run dev              # Start Next.js dev server (default: http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Run TypeScript compiler check
```

### Database (Prisma)
```bash
npx prisma init                    # Initialize Prisma (first time only)
npx prisma generate                # Generate Prisma Client after schema changes
npx prisma migrate dev             # Create and apply migrations in dev
npx prisma migrate dev --name <name>  # Create named migration
npx prisma migrate deploy          # Apply migrations in production
npx prisma studio                  # Open Prisma Studio GUI
npx prisma db push                 # Push schema changes without migration (dev only)
npx prisma db seed                 # Run seed script
```

### Linting & Formatting
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format with Prettier
npm run format:check     # Check formatting without changes
```

### Testing
```bash
npm test                           # Run all tests
npm test -- <test-file-name>       # Run single test file
npm test -- --watch                # Run tests in watch mode
npm test -- --coverage             # Run tests with coverage report
npm test -- -t "test name"         # Run specific test by name
```

**Example:** Run single test file
```bash
npm test -- auth.test.ts
npm test -- src/app/api/auth/__tests__/login.test.ts
```

---

## Code Style Guidelines

### Import Order
Organize imports in this order (with blank lines between groups):
```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. Next.js
import { NextRequest, NextResponse } from 'next/server'

// 3. External libraries
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// 4. Internal utilities/lib
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// 5. Types
import type { User, AuthToken } from '@/types/auth'
```

### TypeScript Conventions

**Strict Mode:** Always use strict TypeScript
```typescript
// tsconfig.json should have:
"strict": true
"noImplicitAny": true
"strictNullChecks": true
```

**Type Definitions:**
- Use `interface` for object shapes, `type` for unions/intersections
- Export types alongside implementation
- Use Prisma-generated types when possible

```typescript
// Good
interface LoginRequest {
  email: string
  password: string
}

type AuthResponse = {
  token: string
  user: User
} | {
  error: string
}

// Use Prisma types
import type { User } from '@prisma/client'
```

### Naming Conventions

**Files & Folders:**
- API routes: `app/api/auth/login/route.ts` (lowercase, kebab-case)
- Components: `components/AuthForm.tsx` (PascalCase)
- Utils: `lib/auth-utils.ts` (kebab-case)
- Types: `types/auth.ts` (lowercase)

**Variables & Functions:**
```typescript
// camelCase for variables and functions
const userEmail = 'user@example.com'
async function getUserByEmail(email: string) { }

// PascalCase for classes and components
class AuthService { }
export default function LoginPage() { }

// UPPER_SNAKE_CASE for constants
const MAX_LOGIN_ATTEMPTS = 5
const TOKEN_EXPIRY_HOURS = 24
```

**Database (Prisma):**
```prisma
// Models: PascalCase
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

// Fields: camelCase
// Tables in DB: snake_case (configure with @@map)
```

### Error Handling

**API Routes (Next.js App Router):**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Business logic
    const user = await prisma.user.findUnique({
      where: { email: body.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ user }, { status: 200 })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

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
│   └── layout.tsx
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # Auth utilities (JWT, bcrypt)
│   └── email.ts           # Email sending logic
├── types/
│   └── auth.ts            # TypeScript type definitions
├── middleware.ts          # Next.js middleware for auth
├── .env                   # Environment variables (never commit)
├── .env.example           # Template for .env
└── package.json
```

---

## Authentication Patterns

### Password Hashing
```typescript
import bcrypt from 'bcrypt'

// Hash password before storing
const hashedPassword = await bcrypt.hash(password, 10)

// Verify password
const isValid = await bcrypt.compare(password, user.hashedPassword)
```

### JWT Tokens
```typescript
import jwt from 'jsonwebtoken'

// Generate token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
)

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET!)
```

### Environment Variables
```bash
# Required in .env
DATABASE_URL="mysql://user:password@localhost:3306/email_auth"
JWT_SECRET="your-secret-key-min-32-chars"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

---

## Testing Guidelines

- Write tests for all API routes
- Mock Prisma client in tests
- Test both success and error cases
- Use descriptive test names

```typescript
describe('POST /api/auth/login', () => {
  it('should return 200 and token for valid credentials', async () => {
    // Test implementation
  })
  
  it('should return 401 for invalid password', async () => {
    // Test implementation
  })
  
  it('should return 400 for missing email', async () => {
    // Test implementation
  })
})
```

---

## General Rules

1. **Never commit secrets** - Use `.env` for sensitive data
2. **Always validate input** - Check email format, password strength, required fields
3. **Use transactions** - When multiple DB operations must succeed together
4. **Rate limiting** - Implement for auth endpoints to prevent brute force
5. **Logging** - Log errors with context, never log passwords/tokens
6. **Security headers** - Use Next.js security headers in `next.config.js`
7. **CORS** - Configure properly if frontend is on different domain

---

## Quick Reference

- **Prisma Client:** Import from `@/lib/prisma` (singleton pattern)
- **API Route Pattern:** `app/api/[resource]/[action]/route.ts`
- **Async/Await:** Always use for DB operations and external calls
- **Type Safety:** Prefer Prisma-generated types over manual definitions
