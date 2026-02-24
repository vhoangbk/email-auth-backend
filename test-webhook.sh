#!/bin/bash

# Test Webhook Manually
# Usage: ./test-webhook.sh

echo "🧪 Testing Stripe Webhook..."
echo ""

# Replace with your actual data
USER_ID="cmm00gu480000i804wnxicpbo"
CUSTOMER_ID="cus_U2GMRkRu1qjREn"
PRICE_ID="price_1T118dAZqXIKHL5D3lOE7fJJ"  # Your actual price ID from .env

# Test subscription.created event
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "type": "customer.subscription.created",
    "data": {
      "object": {
        "id": "sub_test123",
        "object": "subscription",
        "customer": "'$CUSTOMER_ID'",
        "status": "active",
        "current_period_start": '$(date +%s)',
        "current_period_end": '$(date -v+1m +%s 2>/dev/null || date -d "+1 month" +%s)',
        "cancel_at_period_end": false,
        "items": {
          "data": [{
            "price": {
              "id": "'$PRICE_ID'"
            }
          }]
        }
      }
    }
  }'

echo ""
echo "✅ Webhook sent! Check your terminal logs."
