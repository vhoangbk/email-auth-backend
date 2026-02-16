# CORS Configuration Guide

## Overview

CORS (Cross-Origin Resource Sharing) has been configured to allow your frontend to communicate with the backend API when they're hosted on different domains.

## Current Configuration

### 1. Global CORS Headers (next.config.js)

All API routes (`/api/*`) are configured with CORS headers:

```javascript
{
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
}
```

### 2. OPTIONS Handlers

All API routes now include OPTIONS handlers to properly handle CORS preflight requests:

- `/api/auth/*` - Authentication routes
- `/api/user/*` - User profile routes
- `/api/subscriptions/*` - Subscription management routes
- `/api/webhooks/*` - Webhook handlers

## Production Security Configuration

**Important:** The current configuration uses `Access-Control-Allow-Origin: '*'` which allows requests from any origin. This is fine for development but should be restricted in production.

### Recommended Production Configuration

Update [next.config.js](next.config.js) to allow specific origins:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.ALLOWED_ORIGINS || 'https://your-frontend-domain.com' 
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}
```

### Environment Variables

Add to your `.env` file:

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Production (add to Vercel environment variables)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Multiple Origins Support

If you need to support multiple origins, you can modify the configuration:

```javascript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',')

// In your API route handlers (if needed for dynamic CORS):
const origin = request.headers.get('origin')
const isAllowedOrigin = allowedOrigins.includes(origin || '')

return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
  }
})
```

## Testing CORS

### 1. From Your Frontend

```javascript
// Make sure your frontend URL is allowed
fetch('https://email-auth-backend-fawn.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'SecurePass123!',
  }),
})
```

### 2. Using curl

```bash
# Test preflight request
curl -X OPTIONS https://email-auth-backend-fawn.vercel.app/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual request
curl -X POST https://email-auth-backend-fawn.vercel.app/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  -v
```

## Deployment

After making CORS changes:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add CORS support for cross-origin requests"
   ```

2. **Push to deploy:**
   ```bash
   git push origin main
   ```

3. **Verify on Vercel:**
   - Check deployment logs
   - Test API endpoints from your frontend
   - Verify CORS headers in browser DevTools Network tab

## Troubleshooting

### CORS Error Still Persists

1. **Clear browser cache** - Old headers may be cached
2. **Check Vercel deployment** - Ensure latest code is deployed
3. **Verify environment variables** - Check Vercel dashboard
4. **Check browser console** - Look for specific CORS error messages

### Common Issues

- **Credentials not allowed:** Ensure `Access-Control-Allow-Credentials: true` is set
- **Method not allowed:** Add the HTTP method to `Access-Control-Allow-Methods`
- **Header not allowed:** Add the header to `Access-Control-Allow-Headers`
- **Origin not allowed:** Add your frontend domain to allowed origins

## Security Best Practices

1. ✅ **Never use `*` in production** - Always specify allowed origins
2. ✅ **Use HTTPS in production** - Never allow HTTP origins in production
3. ✅ **Limit allowed headers** - Only include headers your API actually uses
4. ✅ **Keep credentials secure** - Use `Access-Control-Allow-Credentials` only when needed
5. ✅ **Monitor CORS logs** - Track which origins are making requests

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Next.js Headers Configuration](https://nextjs.org/docs/api-reference/next.config.js/headers)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
