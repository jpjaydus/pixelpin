'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Crown, Zap, Loader2, ExternalLink } from 'lucide-react'
import { PLANS } from '@/lib/stripe'

interface SubscriptionInfo {
  plan: 'FREE' | 'PRO'
  planDetails: typeof PLANS.FREE | typeof PLANS.PRO
  usage: {
    projects: number
  }
  subscription: {
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeCurrentPeriodEnd: Date | null
  }
}

function PricingContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (success) {
      // Show success message
      setTimeout(() => {
        router.replace('/pricing')
      }, 3000)
    }
  }, [success, router])

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/subscriptions/info')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionInfo(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionInfo()
  }, [session])

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PLANS.PRO.priceId,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open subscription management. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Start free and upgrade when you need more power
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                Welcome to Pro! Your subscription is now active.
              </p>
            </div>
          </div>
        )}

        {/* Canceled Message */}
        {canceled && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Upgrade canceled. You can upgrade anytime when you&apos;re ready.
            </p>
          </div>
        )}

        {/* Current Plan Info */}
        {subscriptionInfo && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">
                  Current Plan: {subscriptionInfo.plan}
                </p>
                <p className="text-blue-600 text-sm">
                  Projects: {subscriptionInfo.usage.projects}
                  {subscriptionInfo.planDetails.limits.projects > 0 && 
                    ` / ${subscriptionInfo.planDetails.limits.projects}`
                  }
                </p>
              </div>
              {subscriptionInfo.plan === 'PRO' && subscriptionInfo.subscription.stripeSubscriptionId && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Free</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">$0</div>
              <p className="text-gray-600">Forever free</p>
            </div>

            <p className="text-gray-600 mb-6">{PLANS.FREE.description}</p>

            <ul className="space-y-3 mb-8">
              {PLANS.FREE.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
            >
              {subscriptionInfo?.plan === 'FREE' ? 'Current Plan' : 'Downgrade Not Available'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-xl border-2 border-blue-500 p-8 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pro</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                ${PLANS.PRO.price}
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <p className="text-gray-600">Billed monthly</p>
            </div>

            <p className="text-gray-600 mb-6">{PLANS.PRO.description}</p>

            <ul className="space-y-3 mb-8">
              {PLANS.PRO.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {subscriptionInfo?.plan === 'PRO' ? (
              <button
                disabled
                className="w-full py-3 px-4 bg-green-100 text-green-700 rounded-lg cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upgrade to Pro'
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need help choosing? Contact us at{' '}
            <a href="mailto:support@pixelpin.com" className="text-blue-600 hover:underline">
              support@pixelpin.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <PricingContent />
    </Suspense>
  )
}