import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe'

import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '@/types/subscription'

/**
 * POST /api/subscriptions/checkout
 * Create Stripe Checkout session for subscription
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
    const body: CreateCheckoutRequest = await request.json()

    if (!body.priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: body.priceId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(
      user.email,
      user.id,
      user.name || undefined
    )

    // Update user with Stripe customer ID if not already set
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      })
    }

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      priceId: body.priceId,
      trialDays: plan.trialDays > 0 ? plan.trialDays : undefined,
    })

    const response: CreateCheckoutResponse = {
      sessionId: session.sessionId,
      url: session.url,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
