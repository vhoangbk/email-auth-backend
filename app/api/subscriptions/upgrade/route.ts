import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateStripeSubscription } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'

import type { UpdateSubscriptionRequest } from '@/types/subscription'

/**
 * POST /api/subscriptions/upgrade
 * Upgrade or downgrade subscription
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
    const body: UpdateSubscriptionRequest = await request.json()

    if (!body.newPriceId) {
      return NextResponse.json(
        { error: 'newPriceId is required' },
        { status: 400 }
      )
    }

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

    // Verify the new plan exists
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: body.newPriceId },
    })

    if (!newPlan) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Update subscription in Stripe
    const updatedStripeSubscription = await updateStripeSubscription(
      user.currentSubscription.stripeSubscriptionId,
      body.newPriceId
    )

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: user.currentSubscription.id },
      data: {
        planId: newPlan.id,
        currentPeriodStart: new Date(
          updatedStripeSubscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          updatedStripeSubscription.current_period_end * 1000
        ),
      },
      include: {
        plan: true,
      },
    })

    // Send upgrade confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Subscription Updated',
        html: `
          <h1>Subscription Updated Successfully</h1>
          <p>Hi ${user.name || 'there'},</p>
          <p>Your subscription has been updated to <strong>${newPlan.displayName}</strong>.</p>
          <p>Your new subscription will be active immediately.</p>
          <p>Next billing date: ${updatedSubscription.currentPeriodEnd?.toLocaleDateString()}</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send upgrade email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        message: 'Subscription updated successfully',
        subscription: updatedSubscription,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscription upgrade error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
