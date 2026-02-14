# ✅ Vercel Deployment Checklist

## Pre-Deployment
- [ ] Code đã push lên GitHub
- [ ] MySQL database đã setup (PlanetScale/Railway/RDS)
- [ ] SMTP credentials đã có (Gmail App Password)
- [ ] Đã tạo JWT_SECRET (32+ characters random)

## Vercel Setup
- [ ] Login vào [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Framework: Next.js (auto-detected)
- [ ] Build Command: `prisma generate && next build`

## Environment Variables (Add All)
```
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_SECRET=<random-32-char-string>
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<gmail-app-password>
SMTP_FROM=noreply@yourdomain.com
```

## Deploy
- [ ] Click "Deploy" button
- [ ] Wait 2-3 minutes cho build
- [ ] Copy Vercel URL khi deploy xong

## Post-Deployment
- [ ] Update `NEXT_PUBLIC_APP_URL` với Vercel URL thật
- [ ] Run database migration:
  ```bash
  export DATABASE_URL="<production-db-url>"
  npx prisma migrate deploy
  # Hoặc cho PlanetScale:
  npx prisma db push
  ```
- [ ] Test API endpoints:
  ```bash
  curl https://your-project.vercel.app/api/auth/register
  ```
- [ ] Check logs trong Vercel Dashboard

## If Using PlanetScale
- [ ] Update `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "mysql"
    url      = env("DATABASE_URL")
    relationMode = "prisma"  // Add this
  }
  ```
- [ ] Add `@@index([userId])` to VerificationToken & PasswordReset
- [ ] Remove `onDelete: Cascade` from relations
- [ ] Commit và redeploy

## Test Checklist
- [ ] `/api/auth/register` - Test tạo user mới
- [ ] `/api/auth/login` - Test login
- [ ] Email verification works
- [ ] Password reset works
- [ ] Check Vercel logs không có errors

## Optional
- [ ] Add custom domain
- [ ] Setup monitoring (Sentry, etc.)
- [ ] Enable Vercel Analytics
- [ ] Setup CI/CD with GitHub Actions

---

**Quick Deploy Command:**
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or deploy via CLI
npm i -g vercel
vercel login
vercel --prod
```

**Troubleshooting:**
- Build fails? Check logs trong Vercel
- Database error? Verify DATABASE_URL và whitelist IPs
- Email not sending? Use Gmail App Password
- Timeout? Update maxDuration trong vercel.json

**Need Help?**
Xem chi tiết trong [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
