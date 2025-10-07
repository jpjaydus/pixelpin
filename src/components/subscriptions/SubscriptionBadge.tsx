'use client'

import { Crown, Zap } from 'lucide-react'
import { PlanType } from '@/lib/stripe'

interface SubscriptionBadgeProps {
  plan: PlanType
  className?: string
}

export default function SubscriptionBadge({ plan, className = '' }: SubscriptionBadgeProps) {

  
  if (plan === 'FREE') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full ${className}`}>
        <Zap className="w-3 h-3" />
        Free
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full ${className}`}>
      <Crown className="w-3 h-3" />
      Pro
    </span>
  )
}