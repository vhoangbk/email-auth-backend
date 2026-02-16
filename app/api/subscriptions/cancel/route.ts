import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelStripeSubscription } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'

import type { CancelSubscriptionRequest } from '@/types/subscription'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

/**
 * POST /api/subscriptions/cancel
 * Cancel user subscription
 * Protected route - requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get request body
    const body: CancelSubscriptionRequest = await request.json().catch(() => ({}))
    const immediate = body.immediate || false

    // Get user with current subscription
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        currentSubscription: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    if (!user.currentSubscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Invalid subscription - missing Stripe ID' },
        { status: 400 }
      )
    }

    // Cancel subscription in Stripe
    const canceledStripeSubscription = await cancelStripeSubscription(
      user.currentSubscription.stripeSubscriptionId,
      immediate
    )

    // Update subscription in database
    const updateData: any = {
      cancelAtPeriodEnd: !immediate,
      canceledAt: new Date(),
    }

    if (immediate) {
      updateData.status = 'CANCELED'
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: user.currentSubscription.id },
      data: updateData,
      include: {
        plan: true,
      },
    })

    // If immediate cancellation, clear current subscription
    if (immediate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentSubscriptionId: null },
      })
    }

    // Send cancellation confirmation email
    try {
      const accessUntil = immediate
        ? 'immediately'
        : updatedSubscription.currentPeriodEnd?.toLocaleDateString() || 'end of period'

      await sendEmail({
        to: user.email,
        subject: 'Subscription Canceled',
        html: `
          <h1>Subscription Canceled</h1>
          <p>Hi ${user.name || 'there'},</p>
          <p>Your subscription to <strong>${user.currentSubscription.plan.displayName}</strong> has been canceled.</p>
          ${
            immediate
              ? '<p>Your access has been terminated immediately.</p>'
              : `<p>You will continue to have access until <strong>${accessUntil}</strong>.</p>`
          }
          <p>You can reactivate your subscription anytime from your account settings.</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period',
        subscription: updatedSubscription,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
