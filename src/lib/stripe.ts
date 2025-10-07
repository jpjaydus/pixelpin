import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceId: '', // Will be set when connecting real Stripe
    features: [
      '1 project',
      '10 annotations per project',
      'Basic collaboration',
      'Email support',
    ],
    limits: {
      projects: 1,
      annotationsPerProject: 10,
    },
  },
  PRO: {
    name: 'Pro',
    description: 'For teams and professionals',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_placeholder_pro',
    features: [
      'Unlimited projects',
      'Unlimited annotations',
      'Real-time collaboration',
      'Priority support',
      'Advanced integrations',
    ],
    limits: {
      projects: -1, // -1 means unlimited
      annotationsPerProject: -1,
    },
  },
} as const

export type PlanType = keyof typeof PLANS

export function getUserPlan(user: {
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
}): PlanType {
  if (
    user.stripeSubscriptionId &&
    user.stripePriceId === PLANS.PRO.priceId &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date()
  ) {
    return 'PRO'
  }
  return 'FREE'
}

export function canCreateProject(user: {
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
}, currentProjectCount: number): boolean {
  const plan = getUserPlan(user)
  const limit = PLANS[plan].limits.projects
  return limit === -1 || currentProjectCount < limit
}

export function canCreateAnnotation(user: {
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
}, currentAnnotationCount: number): boolean {
  const plan = getUserPlan(user)
  const limit = PLANS[plan].limits.annotationsPerProject
  return limit === -1 || currentAnnotationCount < limit
}