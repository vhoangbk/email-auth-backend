#!/bin/bash
# Quick Stripe Payment Test Script
# Run this to test the complete payment flow

set -e

echo "🧪 STRIPE PAYMENT QUICK TEST"
echo "=============================="
echo ""

# Get test user token
echo "📝 Logging in as testuser@example.com..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test1234!"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Make sure testuser@example.com exists and is verified."
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get Pro Monthly plan price ID
echo "📋 Fetching subscription plans..."
PRICE_ID=$(curl -s http://localhost:3000/api/subscriptions/plans | jq -r '.[] | select(.name == "PRO_MONTHLY") | .stripePriceId')

echo "✅ Found Pro Monthly: $PRICE_ID"
echo ""

# Create checkout session
echo "🛒 Creating checkout session..."
CHECKOUT=$(curl -s -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"priceId\":\"$PRICE_ID\"}")

URL=$(echo $CHECKOUT | jq -r '.url')
ERROR=$(echo $CHECKOUT | jq -r '.error // empty')

if [ ! -z "$ERROR" ]; then
  echo "❌ Checkout failed: $ERROR"
  exit 1
fi

echo "✅ Checkout session created!"
echo ""
echo "🌐 CHECKOUT URL:"
echo "$URL"
echo ""
echo "📋 Next Steps:"
echo "1. Open the URL above in your browser"
echo "2. Use test card: 4242 4242 4242 4242"
echo "3. Expiry: 12/34, CVC: 123, ZIP: 12345"
echo "4. Complete the payment"
echo "5. Check your database for the new subscription"
echo ""
echo "💡 Make sure 'stripe listen' is running to process webhooks!"
