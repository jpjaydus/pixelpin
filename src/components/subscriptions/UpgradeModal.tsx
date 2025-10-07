'use client'

import { useState } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { PLANS } from '@/lib/stripe'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'projects' | 'annotations'
  currentCount?: number
  limit?: number
}

export default function UpgradeModal({
  isOpen,
  onClose,
  reason = 'projects',
  currentCount = 0,
  limit = 0,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const getReasonText = () => {
    switch (reason) {
      case 'projects':
        return `You've reached your limit of ${limit} project${limit !== 1 ? 's' : ''}. Upgrade to Pro for unlimited projects.`
      case 'annotations':
        return `You've reached your limit of ${limit} annotations per project. Upgrade to Pro for unlimited annotations.`
      default:
        return 'Upgrade to Pro to unlock all features.'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upgrade Required</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">{getReasonText()}</p>
          
          {currentCount > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Current usage: <span className="font-medium">{currentCount}</span>
                {limit > 0 && (
                  <>
                    {' '}of <span className="font-medium">{limit}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Pro Plan Benefits */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Pro Plan includes:</h3>
          <ul className="space-y-2">
            {PLANS.PRO.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${PLANS.PRO.price}
              <span className="text-sm font-normal text-blue-500">/month</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">Billed monthly</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}