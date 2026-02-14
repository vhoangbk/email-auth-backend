# API Testing Guide

Quick reference for testing the email authentication API endpoints.

## Setup

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Configure environment**: Make sure `.env` is configured with valid database and SMTP credentials.

## Test Endpoints

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'
```

**Expected Response** (201):
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "clx...",
    "email": "test@example.com",
    "name": "Test User",
    "isVerified": false
  }
}
```

### 2. Verify Email

Check your email for the verification link, or get the token from the database:

```bash
curl -X GET "http://localhost:3000/api/auth/verify?token=YOUR_VERIFICATION_TOKEN"
```

**Expected Response** (200):
```json
{
  "message": "Email verified successfully"
}
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Expected Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "test@example.com",
    "name": "Test User",
    "isVerified": true
  }
}
```

**Save the token** - you'll need it for protected endpoints!

### 4. Get User Profile (Protected)

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "email": "test@example.com",
    "name": "Test User",
    "isVerified": true,
    "createdAt": "2024-02-13T...",
    "updatedAt": "2024-02-13T..."
  }
}
```

### 5. Update User Profile (Protected)

```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

**Expected Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "email": "test@example.com",
    "name": "Updated Name",
    "isVerified": true,
    "createdAt": "2024-02-13T...",
    "updatedAt": "2024-02-13T..."
  }
}
```

### 6. Request Password Reset

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response** (200):
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### 7. Reset Password

Check your email for the reset token, then:

```bash
curl -X PUT http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "newPassword": "NewPassword123"
  }'
```

**Expected Response** (200):
```json
{
  "message": "Password reset successfully"
}
```

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Please verify your email before logging in"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Testing with Postman

1. Create a new collection called "Email Auth API"
2. Create requests for each endpoint above
3. Use environment variables for:
   - `{{baseUrl}}` = `http://localhost:3000`
   - `{{token}}` = Your JWT token (set after login)
4. Use Tests tab to automatically save the token:
   ```javascript
   if (pm.response.code === 200) {
     const response = pm.response.json();
     if (response.token) {
       pm.environment.set("token", response.token);
     }
   }
   ```

## Database Inspection

Use Prisma Studio to view database records:

```bash
npx prisma studio
```

Opens at http://localhost:5555

## Tips

- **Email Testing**: Use [Mailtrap](https://mailtrap.io) or [Ethereal Email](https://ethereal.email) for development
- **Token Management**: Store JWT token securely (httpOnly cookies in production)
- **Rate Limiting**: Consider adding rate limiting for auth endpoints
- **CORS**: Configure CORS if frontend is on different domain
