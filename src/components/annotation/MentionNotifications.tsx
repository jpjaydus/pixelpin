'use client'

import { useState, useEffect } from 'react'
import { User } from '@prisma/client'
import { getMentionsForUser } from '@/lib/mentions'

interface MentionNotification {
  id: string
  userId: string
  annotationId?: string
  replyId?: string
  mentionedBy: {
    id: string
    name?: string | null
    email: string
  }
  content: string
  createdAt: Date
  read: boolean
  project: {
    id: string
    name: string
  }
}

interface MentionNotificationsProps {
  currentUser: User
  onNavigateToAnnotation?: (projectId: string, assetId: string, annotationId: string) => void
}

export function MentionNotifications({
  currentUser,
  onNavigateToAnnotation
}: MentionNotificationsProps) {
  const [notifications, setNotifications] = useState<MentionNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [currentUser.id])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const mentions = await getMentionsForUser(currentUser.id)
      setNotifications(mentions as MentionNotification[])
    } catch (error) {
      console.error('Failed to load mention notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5)
  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading mentions...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No mentions yet</p>
        <p className="text-xs text-gray-400 mt-1">
          You&apos;ll see notifications here when someone mentions you in comments
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          Mentions {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <button
          onClick={loadNotifications}
          className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
              !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
            }`}
            onClick={() => {
              if (onNavigateToAnnotation && notification.annotationId) {
                // You'll need to get the asset ID from the annotation
                // onNavigateToAnnotation(notification.project.id, assetId, notification.annotationId)
              }
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.mentionedBy.image ? (
                  <img
                    src={notification.mentionedBy.image}
                    alt={notification.mentionedBy.name || notification.mentionedBy.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                    {(notification.mentionedBy.name || notification.mentionedBy.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">
                    {notification.mentionedBy.name || notification.mentionedBy.email}
                  </span>
                  {' mentioned you in '}
                  <span className="font-medium text-blue-600">
                    {notification.project.name}
                  </span>
                </p>
                
                <p className="text-sm text-gray-600 mt-1">
                  {truncateContent(notification.content)}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {notifications.length > 5 && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${notifications.length - 5} More`}
          </button>
        </div>
      )}
    </div>
  )
}