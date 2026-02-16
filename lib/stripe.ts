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
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  trialDays,
}: {
  userId: string
  userEmail: string
  priceId: string
  trialDays?: number
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      metadata: {
        userId,
      },
      subscription_data: trialDays
        ? {
            trial_period_days: trialDays,
            metadata: {
              userId,
            },
          }
        : {
            metadata: {
              userId,
            },
          },
    })

    return {
      sessionId: session.id,
      url: session.url,
    }
  } catch (error) {
    console.error('Stripe checkout session creation error:', error)
    throw new Error('Failed to create checkout session')
  }
}

/**
 * Create Stripe Billing Portal session
 */
export async function createBillingPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    })

    return {
      url: session.url,
    }
  } catch (error) {
    console.error('Stripe billing portal session error:', error)
    throw new Error('Failed to create billing portal session')
  }
}

/**
 * Update Stripe subscription (for upgrades/downgrades)
 */
export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    )

    return updatedSubscription
  } catch (error) {
    console.error('Stripe subscription update error:', error)
    throw new Error('Failed to update subscription')
  }
}

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

/**
 * Get Stripe customer by email or create new one
 */
export async function getOrCreateStripeCustomer(
  email: string,
  userId: string,
  name?: string
) {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return customers.data[0]
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    })

    return customer
  } catch (error) {
    console.error('Stripe customer creation error:', error)
    throw new Error('Failed to get or create customer')
  }
}
