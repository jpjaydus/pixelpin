'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import { AttachmentList } from './AttachmentList'
import { AttachmentUploader } from './AttachmentUploader'
import { Attachment } from '@/types/attachment'

interface Reply {
  id: string
  content: string
  createdAt: string
  author?: User | null
  guestName?: string | null
  guestEmail?: string | null
  attachments?: Attachment[]
}

interface ReplyThreadProps {
  replies: Reply[]
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
  currentUserId?: string
  isGuest?: boolean
  guestInfo?: {
    name?: string
    email?: string
  }
  isLoading?: boolean
}

export function ReplyThread({
  replies,
  onAddReply,
  currentUserId,
  isGuest = false,
  guestInfo,
  isLoading = false
}: ReplyThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [guestName, setGuestName] = useState(guestInfo?.name || '')
  const [guestEmail, setGuestEmail] = useState(guestInfo?.email || '')
  const [attachments, setAttachments] = useState<{
    id: string
    filename: string
    url: string
    fileType: string
    fileSize: number
  }[]>([])
  const [showAttachments, setShowAttachments] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!replyContent.trim()) {
      setError('Reply cannot be empty')
      return
    }

    if (isGuest && !guestName.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    setError(undefined)

    try {
      await onAddReply({
        content: replyContent.trim(),
        attachments: attachments.length > 0 ? attachments : undefined
      })

      // Reset form
      setReplyContent('')
      setAttachments([])
      setShowAttachments(false)
      setShowReplyForm(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to add reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitReply(e as React.FormEvent)
    } else if (e.key === 'Escape') {
      setShowReplyForm(false)
      setReplyContent('')
      setAttachments([])
      setError(undefined)
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing Replies */}
      {replies.length > 0 && (
        <div className="space-y-3 border-l-2 border-gray-100 pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {reply.author?.name?.[0] || reply.guestName?.[0] || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="font-medium">
                      {reply.author?.name || reply.guestName || 'Guest'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{reply.content}</p>
                  
                  {/* Reply Attachments */}
                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentList
                        attachments={reply.attachments.map(att => ({
                          ...att,
                          mimeType: att.mimeType || att.fileType,
                          fileType: att.fileType || att.mimeType,
                          size: att.size || att.fileSize,
                          fileSize: att.fileSize || att.size
                        }))}
                        currentUserId={currentUserId}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reply Button */}
      {!showReplyForm && (
        <button
          onClick={() => setShowReplyForm(true)}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          💬 Add reply
        </button>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className="space-y-3 border-l-2 border-blue-200 pl-4">
          {/* Guest Information */}
          {isGuest && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Reply Content */}
          <div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">
                  Cmd/Ctrl + Enter to send, Esc to cancel
                </p>
                <button
                  type="button"
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  disabled={isSubmitting}
                >
                  📎 {showAttachments ? 'Hide' : 'Add'} attachments
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {replyContent.length}/1000
              </span>
            </div>
          </div>

          {/* Attachments Section */}
          {showAttachments && (
            <div className="space-y-3">
              <AttachmentUploader
                onAttachmentUploaded={(attachment) => {
                  setAttachments(prev => [...prev, attachment])
                }}
                onError={(error) => setError(error)}
                className="border-t pt-3"
              />
              
              {attachments.length > 0 && (
                <AttachmentList
                  attachments={attachments.map(att => ({
                    ...att,
                    mimeType: att.fileType,
                    createdAt: new Date().toISOString()
                  }))}
                  onDelete={(attachmentId) => {
                    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
                  }}
                />
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false)
                setReplyContent('')
                setAttachments([])
                setError(undefined)
              }}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !replyContent.trim() || (isGuest && !guestName.trim())}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}