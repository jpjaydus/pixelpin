'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import { AnnotationForm } from './AnnotationForm'
import { AttachmentList } from './AttachmentList'
import { ReplyThread } from './ReplyThread'
import { formatBrowserMetadata } from '@/lib/browser-metadata'
import { Attachment } from '@/types/attachment'

interface AnnotationCardProps {
  annotation: {
    id: string
    content: string
    status: 'OPEN' | 'RESOLVED'
    createdAt: string
    screenshot: string
    pageUrl: string
    metadata: any
    position: { x: number; y: number }
    author?: User | null
    guestName?: string | null
    guestEmail?: string | null
    replies?: Array<{
      id: string
      content: string
      createdAt: string
      author?: User | null
      guestName?: string | null
      guestEmail?: string | null
      attachments?: Attachment[]
    }>
    attachments?: Attachment[]
  }
  number: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (data: { content?: string; status?: 'OPEN' | 'RESOLVED' }) => Promise<void>
  onDelete: () => void
  onNavigateToPin: () => void
  onAddReply: (data: {
    content: string
    attachments?: {
      id: string
      filename: string
      url: string
      fileType: string
      fileSize: number
    }[]
  }) => Promise<void>
  currentUser?: User
  isGuest?: boolean
  guestInfo?: {
    name?: string
    email?: string
  }
  bulkMode?: boolean
  isBulkSelected?: boolean
  onBulkToggle?: () => void
}

export function AnnotationCard({
  annotation,
  number,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onNavigateToPin,
  onAddReply,
  currentUser,
  isGuest = false,
  guestInfo,
  bulkMode = false,
  isBulkSelected = false,
  onBulkToggle
}: AnnotationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  const isAuthor = currentUser?.id === annotation.author?.id
  const authorName = annotation.author?.name || annotation.guestName || 'Anonymous'
  const isResolved = annotation.status === 'RESOLVED'

  const handleEdit = () => {
    if (isAuthor || isGuest) {
      setIsEditing(true)
    }
  }

  const handleSave = async (data: { content: string; attachments?: any[] }) => {
    await onUpdate({ content: data.content })
    setIsEditing(false)
  }

  const handleResolve = async () => {
    await onUpdate({ status: isResolved ? 'OPEN' : 'RESOLVED' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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

  const getUrlPath = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search + urlObj.hash
    } catch {
      return url
    }
  }

  return (
    <div
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${isResolved ? 'opacity-75' : ''}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {bulkMode && onBulkToggle ? (
            <input
              type="checkbox"
              checked={isBulkSelected}
              onChange={(e) => {
                e.stopPropagation()
                onBulkToggle()
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          ) : (
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white
                ${isResolved ? 'bg-green-600' : 'bg-blue-600'}
              `}
            >
              {isResolved ? '✓' : number}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{authorName}</p>
            <p className="text-xs text-gray-500">{formatDate(annotation.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Navigate to pin button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigateToPin()
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
            title="Navigate to annotation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Resolve button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleResolve()
            }}
            className={`p-1 rounded transition-colors ${
              isResolved
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-green-600'
            }`}
            title={isResolved ? 'Mark as open' : 'Mark as resolved'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* More options */}
          {(isAuthor || isGuest) && (
            <div className="relative">
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {isEditing ? (
          <AnnotationForm
            annotation={annotation}
            isGuest={isGuest}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            placeholder="Update your comment..."
          />
        ) : (
          <div>
            {annotation.content ? (
              <p 
                className="text-sm text-gray-900 whitespace-pre-wrap cursor-text"
                onDoubleClick={handleEdit}
              >
                {annotation.content}
              </p>
            ) : (
              <p 
                className="text-sm text-gray-500 italic cursor-pointer"
                onClick={handleEdit}
              >
                Click to add comment...
              </p>
            )}
          </div>
        )}
      </div>

      {/* URL Context */}
      <div className="mb-3">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Page:</span> {getUrlPath(annotation.pageUrl)}
        </p>
      </div>

      {/* Screenshot Thumbnail */}
      <div className="mb-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowScreenshot(true)
          }}
          className="block w-full"
        >
          <img
            src={annotation.screenshot}
            alt="Screenshot"
            className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity"
          />
        </button>
      </div>

      {/* Attachments */}
      {annotation.attachments && annotation.attachments.length > 0 && (
        <div className="mb-3">
          <AttachmentList
            attachments={annotation.attachments}
            currentUserId={currentUser?.id}
            showUploader={false}
          />
        </div>
      )}

      {/* Reply Thread */}
      {(annotation.replies && annotation.replies.length > 0) || !isGuest ? (
        <div className="border-t pt-3 mt-3">
          <ReplyThread
            replies={annotation.replies || []}
            onAddReply={onAddReply}
            currentUserId={currentUser?.id}
            isGuest={isGuest}
            guestInfo={guestInfo}
          />
        </div>
      ) : null}

      {/* Metadata Toggle */}
      <div className="border-t pt-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMetadata(!showMetadata)
          }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showMetadata ? 'Hide' : 'Show'} technical details
        </button>
        
        {showMetadata && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <p>{formatBrowserMetadata(annotation.metadata)}</p>
            <p className="mt-1">Position: {annotation.position.x}, {annotation.position.y}</p>
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      {showScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowScreenshot(false)}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={annotation.screenshot}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}