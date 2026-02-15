import type { Subscription, SubscriptionPlan, Invoice, User } from '@prisma/client'

// Subscription Tier Enum
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}

// Subscription Status Enum
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  UNPAID = 'UNPAID',
}

// Invoice Status Enum
export enum InvoiceStatus {
  PAID = 'PAID',
  OPEN = 'OPEN',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
  DRAFT = 'DRAFT',
}

// Billing Interval Type
export type BillingInterval = 'monthly' | 'yearly' | 'lifetime'

// Subscription with relations
export type SubscriptionWithPlan = Subscription & {
  plan: SubscriptionPlan
}

// Invoice with relations
export type InvoiceWithSubscription = Invoice & {
  subscription?: SubscriptionWithPlan | null
}

// Request/Response Types

export interface CreateCheckoutRequest {
  priceId: string
  billingInterval?: BillingInterval
}

export interface CreateCheckoutResponse {
  sessionId: string
  url: string | null
}

export interface UpdateSubscriptionRequest {
  newPriceId: string
}

export interface CancelSubscriptionRequest {
  immediate?: boolean
}

export interface SubscriptionResponse {
  subscription: SubscriptionWithPlan | null
  usage?: {
    remainingTrialDays?: number
    daysUntilRenewal?: number
  }
}

export interface InvoiceResponse {
  invoices: Invoice[]
  total: number
  page: number
  limit: number
}

export interface PlanFeatures {
  maxProjects?: number
  maxUsers?: number
  maxStorage?: string
  apiAccess: boolean
  prioritySupport: boolean
  customDomain: boolean
  analytics: boolean
  [key: string]: any
}

export interface SubscriptionPlanResponse {
  id: string
  name: string
  displayName: string
  price: number
  interval: BillingInterval
  features: PlanFeatures
  isPopular?: boolean
  stripePriceId: string | null
  trialDays: number
}

export interface WebhookEventData {
  type: string
  data: {
    object: any
  }
}

// Error Response
export interface SubscriptionErrorResponse {
  error: string
  details?: string
}
