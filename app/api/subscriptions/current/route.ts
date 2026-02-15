import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import type { SubscriptionResponse } from '@/types/subscription'

/**
 * GET /api/subscriptions/current
 * Get user's current subscription
 * Protected route - requires authentication
 */
export async function GET(request: NextRequest) {
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

    // Calculate usage info
    let usage = {}
    if (user.currentSubscription) {
      const now = new Date()

      // Calculate remaining trial days
      if (
        user.currentSubscription.trialEnd &&
        user.currentSubscription.trialEnd > now
      ) {
        const remainingMs =
          user.currentSubscription.trialEnd.getTime() - now.getTime()
        usage = {
          ...usage,
          remainingTrialDays: Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
        }
      }

      // Calculate days until renewal
      if (
        user.currentSubscription.currentPeriodEnd &&
        user.currentSubscription.currentPeriodEnd > now &&
        !user.currentSubscription.cancelAtPeriodEnd
      ) {
        const renewalMs =
          user.currentSubscription.currentPeriodEnd.getTime() - now.getTime()
        usage = {
          ...usage,
          daysUntilRenewal: Math.ceil(renewalMs / (1000 * 60 * 60 * 24)),
        }
      }
    }

    const response: SubscriptionResponse = {
      subscription: user.currentSubscription,
      usage: Object.keys(usage).length > 0 ? usage : undefined,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Get current subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
