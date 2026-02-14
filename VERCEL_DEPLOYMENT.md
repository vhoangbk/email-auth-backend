# Hướng Dẫn Deploy lên Vercel / Vercel Deployment Guide

## 📋 Yêu Cầu / Prerequisites

- Tài khoản GitHub (để kết nối với Vercel)
- Tài khoản Vercel (miễn phí tại [vercel.com](https://vercel.com))
- MySQL database (PlanetScale, Railway, hoặc bất kỳ MySQL cloud nào)
- SMTP credentials (Gmail, SendGrid, Mailgun, etc.)

---

## 🗄️ Bước 1: Chuẩn Bị Database

Vercel là serverless nên bạn cần database cloud MySQL. Các lựa chọn:

### Option A: PlanetScale (Khuyên dùng - Free tier tốt)

1. Truy cập [planetscale.com](https://planetscale.com)
2. Tạo tài khoản và database mới
3. Tạo connection string:
   ```
   mysql://user:password@aws.connect.psdb.cloud/database?sslaccept=strict
   ```

**Lưu ý:** PlanetScale không hỗ trợ foreign keys, cần update Prisma schema:

```prisma
// Trong schema.prisma, thêm:
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"  // Thêm dòng này cho PlanetScale
}

// Xóa onDelete: Cascade và thêm @@index
model VerificationToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id]) // Xóa , onDelete: Cascade
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])  // Thêm index
  @@map("verification_tokens")
}
```

### Option B: Railway

1. Truy cập [railway.app](https://railway.app)
2. Tạo MySQL database
3. Copy DATABASE_URL từ dashboard

### Option C: Amazon RDS, DigitalOcean, hoặc bất kỳ MySQL cloud nào

---

## 🔐 Bước 2: Chuẩn Bị Environment Variables

Tạo list các biến môi trường cần thiết (từ `.env.example`):

```bash
# Database
DATABASE_URL="mysql://user:password@host:3306/database"

# JWT Secret (tạo random string 32+ ký tự)
JWT_SECRET="your-generated-secret-key-min-32-chars"

# Application URL (sẽ là Vercel URL)
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

**Tạo JWT_SECRET mạnh:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Bước 3: Chuẩn Bị Code

### 3.1. Thêm Build Script cho Prisma

Cập nhật `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "postinstall": "prisma generate"
  }
}
```

### 3.2. Tạo file vercel.json (Tùy chọn nhưng khuyên dùng)

```json
{
  "buildCommand": "prisma generate && next build",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### 3.3. Commit và Push lên GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## 🚀 Bước 4: Deploy lên Vercel

### Via Vercel Dashboard (Cách dễ nhất)

1. **Login vào Vercel:**
   - Truy cập [vercel.com](https://vercel.com)
   - Login bằng GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select GitHub repository của bạn
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (tự động detect)
   - **Root Directory:** `./` (mặc định)
   - **Build Command:** `prisma generate && next build`
   - **Output Directory:** `.next` (mặc định)
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   
   Click "Environment Variables" và thêm tất cả biến từ `.env.example`:
   
   ```
   DATABASE_URL = mysql://...
   JWT_SECRET = your-secret-key
   NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your-email@gmail.com
   SMTP_PASS = your-app-password
   SMTP_FROM = noreply@yourdomain.com
   ```

   **Lưu ý:** Chọn "Production", "Preview", và "Development" cho tất cả biến.

5. **Deploy:**
   - Click "Deploy"
   - Đợi ~2-3 phút

### Via Vercel CLI (Cách nâng cao)

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Hoặc deploy production ngay
vercel --prod
```

---

## 🔧 Bước 5: Run Database Migrations

**Sau khi deploy thành công**, bạn cần chạy migrations:

### Option A: Từ Local Machine

```bash
# Set DATABASE_URL từ production
export DATABASE_URL="mysql://user:password@production-host:3306/database"

# Run migration
npx prisma migrate deploy

# Hoặc nếu dùng PlanetScale (không cần migration)
npx prisma db push
```

### Option B: Từ Vercel CLI

```bash
# Connect to production environment
vercel env pull .env.production

# Load environment
source .env.production  # hoặc set DATABASE_URL manually

# Run migration
npx prisma migrate deploy
```

---

## ✅ Bước 6: Verify Deployment

### Test API Endpoints

```bash
# Test health/basic endpoint
curl https://your-project.vercel.app/api/auth/register

# Test register
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Check Logs

- Vào Vercel Dashboard → Your Project → "Logs"
- Xem real-time logs để debug

---

## 🔄 Bước 7: Update NEXT_PUBLIC_APP_URL

Sau khi có Vercel URL chính thức:

1. Vào Vercel Dashboard → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` với URL chính thức: `https://your-project.vercel.app`
3. Redeploy: Vào "Deployments" → Click "..." trên deployment mới nhất → "Redeploy"

---

## 🎯 Custom Domain (Tùy chọn)

1. Vào Vercel Dashboard → Your Project → Settings → Domains
2. Add domain của bạn (ví dụ: `api.yourdomain.com`)
3. Update DNS records theo hướng dẫn:
   ```
   Type: A
   Name: api
   Value: 76.76.19.19
   
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```
4. Update `NEXT_PUBLIC_APP_URL` với domain mới

---

## 🐛 Troubleshooting

### 1. Build Failed: "Cannot find module @prisma/client"

**Fix:** Thêm `postinstall` script:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### 2. Database Connection Error

**Check:**
- DATABASE_URL đúng format và accessible từ internet
- Firewall/IP whitelist cho phép Vercel IPs
- PlanetScale: Bật "Allow connections from any IP"

### 3. JWT Secret Not Found

**Fix:**
- Verify `JWT_SECRET` đã được add vào Environment Variables
- Redeploy sau khi thêm biến mới

### 4. SMTP/Email Not Sending

**Check:**
- Gmail: Sử dụng "App Password", không phải password thường
- Enable "Less secure app access" (hoặc dùng App Password)
- Test SMTP credentials locally trước

### 5. API Route Timeout

**Fix:** Update `vercel.json`:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

Free tier: max 10s, Pro: max 60s

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
vercel logs your-project --follow

# Recent logs
vercel logs your-project
```

### Analytics
- Vercel Dashboard → Analytics (Pro feature)
- Hoặc integrate với Sentry, LogRocket, etc.

---

## 🔒 Security Checklist

- ✅ JWT_SECRET mạnh (32+ random characters)
- ✅ DATABASE_URL không bị expose trong code
- ✅ SMTP credentials an toàn
- ✅ CORS configured đúng (nếu có frontend riêng)
- ✅ Rate limiting cho auth endpoints
- ✅ HTTPS enabled (mặc định trên Vercel)

---

## 🔄 Continuous Deployment

Vercel tự động deploy khi bạn push code:

- **Production:** Push to `main` branch → Auto deploy
- **Preview:** Push to feature branch → Preview deployment
- **Rollback:** Vercel Dashboard → Deployments → Promote previous deployment

---

## 💰 Pricing Consideration

**Free Tier Limits:**
- 100 GB bandwidth/month
- Serverless function execution time
- Commercial use OK

**When to upgrade to Pro ($20/month):**
- Need longer function timeout (>10s)
- Advanced analytics
- Custom domains with SSL
- Password protection for previews

---

## 📚 Helpful Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PlanetScale with Prisma](https://planetscale.com/docs/prisma/prisma-quickstart)

---

## 🆘 Need Help?

1. Check Vercel logs: `vercel logs`
2. Test locally: `npm run build && npm start`
3. Verify environment variables trong Vercel Dashboard
4. Check database connection từ local → production DB

---

**Chúc bạn deploy thành công! 🎉**

Nếu gặp lỗi, check logs và so sánh với troubleshooting section ở trên.
