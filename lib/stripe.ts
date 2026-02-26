import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

/**
 * Cancel Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediate: boolean = false
) {
  try {
    if (immediate) {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(subscriptionId)
      return subscription
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return subscription
    }
  } catch (error) {
    console.error('Stripe subscription cancellation error:', error)
    throw new Error('Failed to cancel subscription')
  }
}

/**
 * Construct and verify Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}
