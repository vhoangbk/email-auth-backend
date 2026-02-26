import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

/**
 * POST /api/webhooks
 * Handle Stripe webhook events
 * Public endpoint - verified by Stripe signature
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // DEVELOPMENT MODE: Skip signature verification if no signature
    // ⚠️ REMOVE THIS IN PRODUCTION!
    let event: Stripe.Event
    
    if (!signature && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ WARNING: Skipping signature verification in development mode')
      event = JSON.parse(body)
    } else {
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing stripe-signature header' },
          { status: 400 }
        )
      }

      // Verify and construct event
      try {
        event = constructWebhookEvent(body, signature)
      } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        )
      }
    }

    // Handle the event
    // console.log('✅ Received webhook event:', event)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      default:
        break
    }
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed event
 * Creates initial subscription record
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId || session.client_reference_id

    if (!userId) {
      console.error('❌ No userId found in checkout session')
      return
    }

    console.log('👤 User ID:', userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`❌ User not found: ${userId}`)
      return
    }

    console.log('✅ User found:', user.email)

    const subscriptionId = session.subscription as string | undefined

    // Update user with Stripe customer ID
    if (session.customer && typeof session.customer === 'string' && session.subscription && typeof session.subscription === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer, stripeCurrentSubscriptionId: session.subscription },
      })
      console.log('✅ Updated user stripeCustomerId:', session.customer)
    }

    console.log(`✅ Checkout completed for user ${userId}`)
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error)
    throw error
  }
}


/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    past_due: 'PAST_DUE',
    trialing: 'TRIALING',
    unpaid: 'UNPAID',
    paused: 'CANCELED',
  }

  return statusMap[stripeStatus] || 'INCOMPLETE'
}
