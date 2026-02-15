import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 * Public endpoint - verified by Stripe signature
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify and construct event
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    console.log(`Received webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
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
      console.error('No userId found in checkout session')
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`User not found: ${userId}`)
      return
    }

    // Update user with Stripe customer ID
    if (session.customer && typeof session.customer === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      })
    }

    console.log(`Checkout completed for user ${userId}`)
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
    throw error
  }
}

/**
 * Handle customer.subscription.created/updated event
 * Creates or updates subscription record
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!user) {
      console.error(`User not found for customer: ${customerId}`)
      return
    }

    // Get the price ID from subscription
    const priceId = subscription.items.data[0]?.price.id

    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    // Find the plan by Stripe price ID
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { stripePriceId: priceId },
    })

    if (!plan) {
      console.error(`Plan not found for price ID: ${priceId}`)
      return
    }

    // Map Stripe status to our status
    const status = mapStripeStatus(subscription.status)

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    const subscriptionData = {
      userId: user.id,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodStart: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000) 
        : null,
      currentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    }

    let subscriptionRecord

    if (existingSubscription) {
      // Update existing subscription
      subscriptionRecord = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: subscriptionData,
        include: { plan: true },
      })
    } else {
      // Create new subscription
      subscriptionRecord = await prisma.subscription.create({
        data: subscriptionData,
        include: { plan: true },
      })
    }

    // Update user's current subscription
    await prisma.user.update({
      where: { id: user.id },
      data: { currentSubscriptionId: subscriptionRecord.id },
    })

    // Send confirmation email for new subscriptions
    if (!existingSubscription && status === 'ACTIVE') {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Subscription Activated',
          html: `
            <h1>Welcome to ${plan.displayName}!</h1>
            <p>Hi ${user.name || 'there'},</p>
            <p>Your subscription has been activated successfully.</p>
            <p>Plan: <strong>${plan.displayName}</strong></p>
            <p>Next billing date: ${subscriptionRecord.currentPeriodEnd?.toLocaleDateString()}</p>
            <p>Thank you for subscribing!</p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send subscription confirmation email:', emailError)
      }
    }

    console.log(`Subscription ${subscription.id} updated for user ${user.id}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, plan: true },
    })

    if (!existingSubscription) {
      console.error(`Subscription not found: ${subscription.id}`)
      return
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    })

    // Clear user's current subscription
    await prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { currentSubscriptionId: null },
    })

    console.log(`Subscription ${subscription.id} deleted`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

/**
 * Handle invoice.paid event
 * Creates invoice record and sends receipt
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    const customerId = typeof invoice.customer === 'string' 
      ? invoice.customer 
      : invoice.customer?.id

    if (!customerId) {
      console.error('No customer ID found in invoice')
      return
    }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!user) {
      console.error(`User not found for customer: ${customerId}`)
      return
    }

    // Find associated subscription
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription?.id

    let dbSubscription = null
    if (subscriptionId) {
      dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      })
    }

    // Create invoice record
    await prisma.invoice.create({
      data: {
        userId: user.id,
        subscriptionId: dbSubscription?.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Convert cents to dollars
        currency: invoice.currency,
        status: 'PAID',
        invoiceUrl: invoice.hosted_invoice_url,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      },
    })

    // Send receipt email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Payment Receipt',
        html: `
          <h1>Payment Received</h1>
          <p>Hi ${user.name || 'there'},</p>
          <p>Thank you for your payment!</p>
          <p>Amount: $${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}</p>
          <p>Date: ${new Date(invoice.status_transitions.paid_at! * 1000).toLocaleDateString()}</p>
          ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">View Invoice</a></p>` : ''}
        `,
      })
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError)
    }

    console.log(`Invoice ${invoice.id} paid for user ${user.id}`)
  } catch (error) {
    console.error('Error handling invoice paid:', error)
    throw error
  }
}

/**
 * Handle invoice.payment_failed event
 * Updates subscription status and sends notification
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = typeof invoice.customer === 'string' 
      ? invoice.customer 
      : invoice.customer?.id

    if (!customerId) {
      console.error('No customer ID found in invoice')
      return
    }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!user) {
      console.error(`User not found for customer: ${customerId}`)
      return
    }

    // Find associated subscription
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription?.id

    if (subscriptionId) {
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      })

      if (dbSubscription) {
        // Update subscription status
        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: { status: 'PAST_DUE' },
        })
      }
    }

    // Send payment failed notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Payment Failed',
        html: `
          <h1>Payment Failed</h1>
          <p>Hi ${user.name || 'there'},</p>
          <p>We were unable to process your payment.</p>
          <p>Amount: $${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}</p>
          <p>Please update your payment method to avoid service interruption.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription">Update Payment Method</a></p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send payment failed email:', emailError)
    }

    console.log(`Payment failed for invoice ${invoice.id}, user ${user.id}`)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
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
