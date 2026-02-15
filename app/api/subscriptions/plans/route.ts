import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import type { SubscriptionPlanResponse } from '@/types/subscription'

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    })

    const plansResponse: SubscriptionPlanResponse[] = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      interval: plan.interval as 'monthly' | 'yearly' | 'lifetime',
      features: plan.features as any,
      isPopular: plan.name === 'PRO',
      stripePriceId: plan.stripePriceId,
      trialDays: plan.trialDays,
    }))

    return NextResponse.json(plansResponse, { status: 200 })
  } catch (error) {
    console.error('Get subscription plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}
