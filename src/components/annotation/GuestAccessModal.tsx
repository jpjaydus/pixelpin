'use client'

import { useState } from 'react'
import { Project } from '@prisma/client'

interface GuestAccessModalProps {
  project: Project & {
    shareToken?: string | null
    guestAccessEnabled: boolean
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: { guestAccessEnabled: boolean; shareToken?: string }) => Promise<void>
}

export function GuestAccessModal({
  project,
  isOpen,
  onClose,
  onUpdate
}: GuestAccessModalProps) {
  const [guestAccessEnabled, setGuestAccessEnabled] = useState(project.guestAccessEnabled)
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const generateShareUrl = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/guest/${project.id}?token=${token}`
  }

  const handleToggleAccess = async () => {
    setIsLoading(true)
    try {
      const newEnabled = !guestAccessEnabled
      let shareToken = project.shareToken

      if (newEnabled && !shareToken) {
        // Generate new share token
        shareToken = generateShareToken()
      }

      await onUpdate({
        guestAccessEnabled: newEnabled,
        shareToken: newEnabled ? shareToken : undefined
      })

      setGuestAccessEnabled(newEnabled)
      if (newEnabled && shareToken) {
        setShareUrl(generateShareUrl(shareToken))
      }
    } catch (error) {
      console.error('Failed to update guest access:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  const handleRegenerateToken = async () => {
    setIsLoading(true)
    try {
      const newToken = generateShareToken()
      await onUpdate({
        guestAccessEnabled: true,
        shareToken: newToken
      })
      setShareUrl(generateShareUrl(newToken))
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (!isOpen) return null

  // Initialize share URL if guest access is already enabled
  if (guestAccessEnabled && project.shareToken && !shareUrl) {
    setShareUrl(generateShareUrl(project.shareToken))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Guest Access
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Allow anyone with the link to view and comment on this project without signing up.
            </p>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Enable Guest Access
                </h3>
                <p className="text-xs text-gray-500">
                  Guests can view assets and add comments
                </p>
              </div>
              <button
                onClick={handleToggleAccess}
                disabled={isLoading}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${guestAccessEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${guestAccessEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Share URL Section */}
          {guestAccessEnabled && shareUrl && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Anyone with this link can access the project
                </p>
                <button
                  onClick={handleRegenerateToken}
                  disabled={isLoading}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  Regenerate Link
                </button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Security Notice
                </h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Guest comments will include the name and email provided by the commenter. 
                  You can disable guest access at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}