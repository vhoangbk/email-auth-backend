# 📘 LUỒNG MUA SUBSCRIPTION

## 🎯 Tổng Quan

```
User → Subscription Page → Checkout → Stripe Payment → Webhook → Database → Success
```

---

## 📋 CHI TIẾT TỪNG BƯỚC

### **BƯỚC 1: User Chọn Gói Subscription** 
📍 Tại: `app/subscription/page.tsx`

```typescript
// User click "Subscribe Now"
handleCheckout(plan.stripePriceId, plan.displayName)
```

**Điều kiện:**
- ✅ User phải đã đăng nhập (có `token`)
- ✅ Plan phải có `stripePriceId` (Stripe Price ID)

---

### **BƯỚC 2: Tạo Checkout Session**
📍 API: `POST /api/subscriptions/checkout`

**Frontend gửi request:**
```typescript
fetch('/api/subscriptions/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    priceId: 'price_xxx' // Stripe Price ID
  })
})
```

**Backend xử lý:**

```typescript
// 1. Xác thực user
verifyToken(token) // Kiểm tra JWT token

// 2. Lấy thông tin user từ database
const user = await prisma.user.findUnique({ where: { id: userId } })

// 3. Verify plan tồn tại
const plan = await prisma.subscriptionPlan.findUnique({ 
  where: { stripePriceId: priceId } 
})

// 4. Tạo hoặc lấy Stripe Customer
const customer = await getOrCreateStripeCustomer(
  user.email, 
  user.id, 
  user.name
)

// 5. Cập nhật stripeCustomerId cho user
await prisma.user.update({
  where: { id: user.id },
  data: { stripeCustomerId: customer.id }
})

// 6. Tạo Stripe Checkout Session
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{
    price: priceId,
    quantity: 1
  }],
  customer_email: user.email,
  client_reference_id: userId,
  success_url: '/subscription/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: '/subscription/cancel',
  subscription_data: {
    trial_period_days: plan.trialDays, // Nếu có trial
    metadata: { userId }
  }
})

// 7. Trả về URL để redirect
return { sessionId: session.id, url: session.url }
```

**Kết quả:**
- ✅ Backend trả về Stripe Checkout URL
- ✅ Frontend redirect user đến trang thanh toán Stripe

---

### **BƯỚC 3: User Thanh Toán Trên Stripe**
📍 Tại: Stripe Hosted Checkout Page

User nhập thông tin:
- 💳 Số thẻ (Card Number)
- 📅 Expiry Date
- 🔒 CVV/CVC
- 📧 Email (tự động điền)

**2 Kết quả có thể xảy ra:**

✅ **Thanh toán thành công** → Redirect: `/subscription/success?session_id=xxx`

❌ **User hủy/thất bại** → Redirect: `/subscription/cancel`

---

### **BƯỚC 4: Stripe Gửi Webhook Events**
📍 API: `POST /api/webhooks/stripe`

Sau khi thanh toán, Stripe tự động gửi các webhook events:

#### **Event 1: `checkout.session.completed`**
```typescript
// Xử lý khi checkout hoàn tất
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId
  
  // Cập nhật stripeCustomerId cho user
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: session.customer }
  })
}
```

#### **Event 2: `customer.subscription.created`**
```typescript
// Tạo subscription record trong database
async function handleSubscriptionUpdated(subscription) {
  // 1. Tìm user theo stripeCustomerId
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer }
  })
  
  // 2. Tìm plan theo stripePriceId
  const priceId = subscription.items.data[0].price.id
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { stripePriceId: priceId }
  })
  
  // 3. Tạo subscription record
  const subscriptionRecord = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: 'ACTIVE', // hoặc 'TRIALING' nếu có trial
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(...) : null,
      trialEnd: subscription.trial_end ? new Date(...) : null,
      cancelAtPeriodEnd: false
    }
  })
  
  // 4. Cập nhật currentSubscriptionId cho user
  await prisma.user.update({
    where: { id: user.id },
    data: { currentSubscriptionId: subscriptionRecord.id }
  })
  
  // 5. Gửi email xác nhận
  await sendEmail({
    to: user.email,
    subject: 'Subscription Activated',
    html: `Welcome to ${plan.displayName}!`
  })
}
```

#### **Event 3: `invoice.paid`**
```typescript
// Tạo invoice record khi thanh toán thành công
async function handleInvoicePaid(invoice) {
  // 1. Tìm user
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer }
  })
  
  // 2. Tạo invoice record
  await prisma.invoice.create({
    data: {
      userId: user.id,
      subscriptionId: dbSubscription?.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100, // Convert cents → dollars
      currency: invoice.currency,
      status: 'PAID',
      invoiceUrl: invoice.hosted_invoice_url,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000)
    }
  })
  
  // 3. Gửi email receipt
  await sendEmail({
    to: user.email,
    subject: 'Payment Receipt',
    html: `Amount: $${(invoice.amount_paid / 100).toFixed(2)}`
  })
}
```

---

### **BƯỚC 5: User Được Redirect Về Success Page**
📍 Tại: `/subscription/success?session_id=xxx`

User thấy:
- ✅ Thông báo "Subscription successful!"
- 📋 Chi tiết subscription
- 🔗 Link quay về trang subscription

---

## 🗄️ THAY ĐỔI TRONG DATABASE

### **Bảng `users`**
```sql
UPDATE users SET 
  stripeCustomerId = 'cus_xxx',
  currentSubscriptionId = 'sub_yyy'
WHERE id = 'user_id';
```

### **Bảng `subscriptions`**
```sql
INSERT INTO subscriptions (
  id, userId, planId, 
  stripeSubscriptionId,
  status, 
  currentPeriodStart,
  currentPeriodEnd,
  trialStart, trialEnd,
  cancelAtPeriodEnd
) VALUES (
  'sub_yyy',
  'user_id',
  'plan_id',
  'sub_stripe_xxx',
  'ACTIVE',
  '2024-02-24',
  '2024-03-24',
  NULL, NULL,
  false
);
```

### **Bảng `invoices`**
```sql
INSERT INTO invoices (
  id, userId, subscriptionId,
  stripeInvoiceId,
  amount, currency, status,
  invoiceUrl, paidAt
) VALUES (
  'inv_zzz',
  'user_id',
  'sub_yyy',
  'in_stripe_xxx',
  9.99, 'usd', 'PAID',
  'https://invoice.stripe.com/xxx',
  '2024-02-24 10:00:00'
);
```

---

## 🔄 SƠ ĐỒ LUỒNG DỮ LIỆU

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "SUBSCRIBE"                                  │
│    → Frontend: handleCheckout(priceId)                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE CHECKOUT SESSION                                  │
│    → POST /api/subscriptions/checkout                       │
│    → Verify user, plan                                      │
│    → Create/Get Stripe Customer                             │
│    → Create Stripe Checkout Session                         │
│    → Return checkout URL                                    │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REDIRECT TO STRIPE                                       │
│    → User enters payment info                               │
│    → Stripe processes payment                               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
           ┌─────────┴──────────┐
           ↓                    ↓
    ┌──────────┐         ┌──────────┐
    │ SUCCESS  │         │  CANCEL  │
    └────┬─────┘         └──────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. STRIPE SENDS WEBHOOKS (Background)                       │
│    → checkout.session.completed                             │
│    → customer.subscription.created                          │
│    → invoice.paid                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. WEBHOOK HANDLER UPDATES DATABASE                         │
│    → Create subscription record                             │
│    → Update user.currentSubscriptionId                      │
│    → Create invoice record                                  │
│    → Send confirmation emails                               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. USER SEES SUCCESS PAGE                                   │
│    → /subscription/success                                  │
│    → Can now use premium features                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 BẢO MẬT

1. **JWT Token Verification** - Mọi API đều verify token
2. **Stripe Signature Verification** - Webhook verify signature từ Stripe
3. **Database Transactions** - Đảm bảo consistency
4. **Metadata Tracking** - userId trong Stripe metadata

---

## 📧 EMAIL NOTIFICATIONS

**Email được gửi tự động:**
1. ✅ **Subscription Activated** - Khi subscription active
2. 💰 **Payment Receipt** - Khi thanh toán thành công
3. ❌ **Payment Failed** - Khi thanh toán thất bại

---

## ⚙️ CÁC TRƯỜNG HỢP ĐẶC BIỆT

### **Có Trial Period:**
```typescript
subscription_data: {
  trial_period_days: 14, // 14 ngày trial
  metadata: { userId }
}
```
- Status: `TRIALING` → `ACTIVE` (sau trial)
- Không charge ngay lập tức

### **Không có Trial:**
- Charge ngay lập tức
- Status: `ACTIVE`

### **Payment Failed:**
- Event: `invoice.payment_failed`
- Status: `PAST_DUE`
- Gửi email thông báo
- User cần update payment method

---

## 🔄 RENEWAL (GIA HẠN TỰ ĐỘNG)

### **Khi đến ngày renewal:**
1. Stripe tự động charge thẻ
2. Nếu thành công:
   - Event: `invoice.paid`
   - Cập nhật `currentPeriodEnd` mới
   - Gửi email receipt
3. Nếu thất bại:
   - Event: `invoice.payment_failed`
   - Status → `PAST_DUE`
   - Stripe retry theo cấu hình

---

## 🔄 CANCEL SUBSCRIPTION

### **Cancel at Period End (Mặc định):**
```typescript
POST /api/subscriptions/cancel
Body: { immediate: false }
```

**Xử lý:**
```typescript
// Update Stripe subscription
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true
})

// Update database
await prisma.subscription.update({
  where: { id: subscriptionId },
  data: { cancelAtPeriodEnd: true }
})
```

**Kết quả:**
- ✅ User vẫn dùng được đến hết kỳ
- ⏰ Sau `currentPeriodEnd` → Status: `CANCELED`
- 🚫 Không charge tiếp

### **Cancel Immediately:**
```typescript
Body: { immediate: true }
```

**Xử lý:**
```typescript
// Cancel immediately on Stripe
await stripe.subscriptions.cancel(subscriptionId)

// Update database
await prisma.subscription.update({
  where: { id: subscriptionId },
  data: { 
    status: 'CANCELED',
    canceledAt: new Date()
  }
})
```

**Kết quả:**
- ❌ Subscription hủy ngay lập tức
- 🚫 Không hoàn tiền
- 🔒 User mất quyền truy cập ngay

---

## 🔄 UPGRADE/DOWNGRADE SUBSCRIPTION

📍 API: `POST /api/subscriptions/upgrade`

```typescript
// Frontend gửi request
fetch('/api/subscriptions/upgrade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    newPriceId: 'price_premium_monthly'
  })
})
```

**Backend xử lý:**
```typescript
// 1. Lấy subscription hiện tại
const currentSub = await prisma.subscription.findFirst({
  where: { userId: user.id, status: 'ACTIVE' }
})

// 2. Update trên Stripe
const updatedSubscription = await stripe.subscriptions.update(
  currentSub.stripeSubscriptionId,
  {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId
    }],
    proration_behavior: 'create_prorations' // Tính tiền theo tỷ lệ
  }
)

// 3. Webhook sẽ tự động update database
```

**Proration (Tính tiền theo tỷ lệ):**
- **Upgrade**: Charge ngay phần chênh lệch
- **Downgrade**: Credit vào lần charge tiếp theo

---

## 🔄 BILLING PORTAL

📍 API: `POST /api/subscriptions/portal`

```typescript
// Tạo Stripe Billing Portal session
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripeCustomerId,
  return_url: `${NEXT_PUBLIC_APP_URL}/subscription`
})

// Redirect user đến portal
window.location.href = session.url
```

**User có thể:**
- 💳 Update payment method
- 🔄 Change subscription plan
- ❌ Cancel subscription
- 📄 View invoices
- 📧 Update email

---

## 🧪 TESTING

### **Stripe Test Cards:**

**Success:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

**Decline:**
```
Card: 4000 0000 0000 0002
```

**Requires Authentication (3D Secure):**
```
Card: 4000 0025 0000 3155
```

### **Webhook Testing:**

**1. Using Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

**2. Manual Testing:**
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/stripe`
- Test with sample events

---

## 📊 SUBSCRIPTION STATUSES

| Status | Meaning | User Access |
|--------|---------|-------------|
| `ACTIVE` | Đang hoạt động | ✅ Full access |
| `TRIALING` | Đang trong trial | ✅ Full access |
| `PAST_DUE` | Thanh toán thất bại | ⚠️ Limited access |
| `CANCELED` | Đã hủy | ❌ No access |
| `INCOMPLETE` | Chưa thanh toán xong | ❌ No access |
| `INCOMPLETE_EXPIRED` | Expired trước khi thanh toán | ❌ No access |
| `UNPAID` | Chưa trả tiền | ❌ No access |

---

## 🔍 DEBUGGING

### **Check Logs:**

**1. Backend logs:**
```bash
# Check API logs
console.log('Checkout session created:', session.id)

# Check webhook logs
console.log('Received webhook event:', event.type)
```

**2. Stripe Dashboard:**
- Events → See all webhook events
- Logs → See API requests
- Customers → See customer data

**3. Database:**
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE userId = 'xxx';

-- Check invoices
SELECT * FROM invoices WHERE userId = 'xxx';
```

---

## 📝 CHECKLIST TRIỂN KHAI

### **1. Environment Variables:**
```bash
✅ STRIPE_SECRET_KEY
✅ STRIPE_PUBLISHABLE_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ NEXT_PUBLIC_APP_URL
✅ DATABASE_URL
✅ JWT_SECRET
✅ SMTP_* (for emails)
```

### **2. Stripe Dashboard Setup:**
```
✅ Create Products & Prices
✅ Setup Webhook endpoint
✅ Configure Billing Portal
✅ Test with test mode
✅ Switch to live mode (production)
```

### **3. Database:**
```
✅ Run migrations: npx prisma migrate deploy
✅ Seed plans: npx prisma db seed
✅ Verify tables exist
```

### **4. Testing:**
```
✅ Test checkout flow
✅ Test webhook events
✅ Test cancellation
✅ Test upgrade/downgrade
✅ Test payment failures
```

---

## 🚀 PRODUCTION NOTES

### **1. Security:**
- ✅ Use HTTPS only
- ✅ Verify webhook signatures
- ✅ Sanitize user inputs
- ✅ Rate limit API endpoints

### **2. Error Handling:**
- ✅ Log all errors
- ✅ Send alerts for critical errors
- ✅ Graceful fallbacks

### **3. Monitoring:**
- ✅ Monitor webhook delivery
- ✅ Track failed payments
- ✅ Monitor subscription metrics

### **4. Backup:**
- ✅ Regular database backups
- ✅ Backup webhook events

---

## 📚 TÀI LIỆU THAM KHẢO

- [Stripe Subscriptions Docs](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Cập nhật lần cuối:** 24/02/2024
