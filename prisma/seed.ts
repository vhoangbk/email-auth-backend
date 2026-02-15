import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create subscription plans
  console.log('Creating subscription plans...')

  // Free Plan
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: 'Free Plan',
      stripePriceId: null,
      price: 0,
      interval: 'lifetime',
      trialDays: 0,
      features: {
        maxProjects: 3,
        maxUsers: 1,
        maxStorageGB: 1,
        apiAccess: false,
        prioritySupport: false,
        customDomain: false,
        analytics: false,
      },
      isActive: true,
    },
  })
  console.log('✅ Free Plan created:', freePlan.id)

  // Pro Monthly Plan
  const proMonthly = await prisma.subscriptionPlan.upsert({
    where: { name: 'PRO_MONTHLY' },
    update: {},
    create: {
      name: 'PRO_MONTHLY',
      displayName: 'Pro Plan (Monthly)',
      stripePriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_monthly',
      price: 29.99,
      interval: 'monthly',
      trialDays: 14,
      features: {
        maxProjects: 20,
        maxUsers: 5,
        maxStorageGB: 50,
        apiAccess: true,
        prioritySupport: true,
        customDomain: false,
        analytics: true,
      },
      isActive: true,
    },
  })
  console.log('✅ Pro Monthly Plan created:', proMonthly.id)

  // Pro Yearly Plan
  const proYearly = await prisma.subscriptionPlan.upsert({
    where: { name: 'PRO_YEARLY' },
    update: {},
    create: {
      name: 'PRO_YEARLY',
      displayName: 'Pro Plan (Yearly)',
      stripePriceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY || 'price_pro_yearly',
      price: 299.99,
      interval: 'yearly',
      trialDays: 14,
      features: {
        maxProjects: 20,
        maxUsers: 5,
        maxStorageGB: 50,
        apiAccess: true,
        prioritySupport: true,
        customDomain: false,
        analytics: true,
      },
      isActive: true,
    },
  })
  console.log('✅ Pro Yearly Plan created:', proYearly.id)

  // Premium Monthly Plan
  const premiumMonthly = await prisma.subscriptionPlan.upsert({
    where: { name: 'PREMIUM_MONTHLY' },
    update: {},
    create: {
      name: 'PREMIUM_MONTHLY',
      displayName: 'Premium Plan (Monthly)',
      stripePriceId:
        process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || 'price_premium_monthly',
      price: 99.99,
      interval: 'monthly',
      trialDays: 14,
      features: {
        maxProjects: -1,
        maxUsers: -1,
        maxStorageGB: 500,
        apiAccess: true,
        prioritySupport: true,
        customDomain: true,
        analytics: true,
        whiteLabel: true,
        dedicatedSupport: true,
      },
      isActive: true,
    },
  })
  console.log('✅ Premium Monthly Plan created:', premiumMonthly.id)

  // Premium Yearly Plan
  const premiumYearly = await prisma.subscriptionPlan.upsert({
    where: { name: 'PREMIUM_YEARLY' },
    update: {},
    create: {
      name: 'PREMIUM_YEARLY',
      displayName: 'Premium Plan (Yearly)',
      stripePriceId:
        process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY || 'price_premium_yearly',
      price: 999.99,
      interval: 'yearly',
      trialDays: 14,
      features: {
        maxProjects: -1,
        maxUsers: -1,
        maxStorageGB: 500,
        apiAccess: true,
        prioritySupport: true,
        customDomain: true,
        analytics: true,
        whiteLabel: true,
        dedicatedSupport: true,
      },
      isActive: true,
    },
  })
  console.log('✅ Premium Yearly Plan created:', premiumYearly.id)

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
