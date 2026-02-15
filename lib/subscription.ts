import { prisma } from '@/lib/prisma'
import { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ['ACTIVE', 'TRIALING'],
      },
    },
  })

  return !!subscription
}

/**
 * Get user's subscription tier
 */
export async function getUserSubscriptionTier(
  userId: string
): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      currentSubscription: {
        include: {
          plan: true,
        },
      },
    },
  })

  if (!user || !user.currentSubscription) {
    return SubscriptionTier.FREE
  }

  const planName = user.currentSubscription.plan.name.toUpperCase()

  if (planName.includes('PRO')) {
    return SubscriptionTier.PRO
  } else if (planName.includes('PREMIUM')) {
    return SubscriptionTier.PREMIUM
  }

  return SubscriptionTier.FREE
}

/**
 * Check if user can access a specific feature
 * @param userId - User ID
 * @param feature - Feature key to check
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId)

  // Define feature access by tier
  const featureAccess: Record<SubscriptionTier, string[]> = {
    [SubscriptionTier.FREE]: ['basic_features', 'limited_projects'],
    [SubscriptionTier.PRO]: [
      'basic_features',
      'limited_projects',
      'advanced_features',
      'api_access',
      'priority_support',
    ],
    [SubscriptionTier.PREMIUM]: [
      'basic_features',
      'limited_projects',
      'advanced_features',
      'api_access',
      'priority_support',
      'custom_domain',
      'analytics',
      'white_label',
      'dedicated_support',
    ],
  }

  const allowedFeatures = featureAccess[tier] || []
  return allowedFeatures.includes(feature)
}

/**
 * Get remaining trial days for a subscription
 */
export function getRemainingTrialDays(
  trialEnd: Date | null | undefined
): number {
  if (!trialEnd) {
    return 0
  }

  const now = new Date()
  if (trialEnd <= now) {
    return 0
  }

  const remainingMs = trialEnd.getTime() - now.getTime()
  return Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
}

/**
 * Get subscription usage limits based on tier
 */
export async function getSubscriptionLimits(userId: string) {
  const tier = await getUserSubscriptionTier(userId)

  const limits = {
    [SubscriptionTier.FREE]: {
      maxProjects: 3,
      maxUsers: 1,
      maxStorageGB: 1,
      apiCallsPerMonth: 100,
    },
    [SubscriptionTier.PRO]: {
      maxProjects: 20,
      maxUsers: 5,
      maxStorageGB: 50,
      apiCallsPerMonth: 10000,
    },
    [SubscriptionTier.PREMIUM]: {
      maxProjects: -1, // Unlimited
      maxUsers: -1, // Unlimited
      maxStorageGB: 500,
      apiCallsPerMonth: -1, // Unlimited
    },
  }

  return limits[tier]
}

/**
 * Check if subscription is in grace period (past due but not canceled)
 */
export async function isInGracePeriod(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'PAST_DUE',
    },
  })

  return !!subscription
}

/**
 * Get days until subscription renewal
 */
export async function getDaysUntilRenewal(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      currentSubscription: true,
    },
  })

  if (!user || !user.currentSubscription || !user.currentSubscription.currentPeriodEnd) {
    return null
  }

  if (user.currentSubscription.cancelAtPeriodEnd) {
    return null
  }

  const now = new Date()
  const periodEnd = user.currentSubscription.currentPeriodEnd

  if (periodEnd <= now) {
    return 0
  }

  const remainingMs = periodEnd.getTime() - now.getTime()
  return Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
}

/**
 * Middleware-like function to check subscription access
 * Throws error if user doesn't have required tier
 */
export async function requireSubscriptionTier(
  userId: string,
  requiredTier: SubscriptionTier
): Promise<void> {
  const userTier = await getUserSubscriptionTier(userId)

  const tierHierarchy = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.PRO]: 1,
    [SubscriptionTier.PREMIUM]: 2,
  }

  if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
    throw new Error(
      `This feature requires ${requiredTier} subscription or higher`
    )
  }
}
