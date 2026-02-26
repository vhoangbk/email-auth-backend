import { prisma } from '@/lib/prisma'
import { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'

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

