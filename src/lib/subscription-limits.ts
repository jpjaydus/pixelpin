import { prisma } from '@/lib/prisma'
import { getUserPlan, PLANS } from '@/lib/stripe'

export async function checkProjectLimit(userId: string): Promise<{
  canCreate: boolean
  currentCount: number
  limit: number
  plan: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const plan = getUserPlan(user)
  const currentCount = user._count.projects
  const limit = PLANS[plan].limits.projects
  const canCreate = limit === -1 || currentCount < limit

  return {
    canCreate,
    currentCount,
    limit,
    plan,
  }
}

export async function checkAnnotationLimit(
  userId: string,
  projectId: string
): Promise<{
  canCreate: boolean
  currentCount: number
  limit: number
  plan: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Verify user owns the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  })

  if (!project) {
    throw new Error('Project not found or access denied')
  }

  // Count annotations in this project
  const currentCount = await prisma.annotation.count({
    where: {
      asset: {
        projectId,
      },
    },
  })

  const plan = getUserPlan(user)
  const limit = PLANS[plan].limits.annotationsPerProject
  const canCreate = limit === -1 || currentCount < limit

  return {
    canCreate,
    currentCount,
    limit,
    plan,
  }
}

export async function getUserSubscriptionInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const plan = getUserPlan(user)
  const planDetails = PLANS[plan]

  return {
    plan,
    planDetails,
    usage: {
      projects: user._count.projects,
    },
    subscription: {
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    },
  }
}