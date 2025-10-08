'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from '@prisma/client'
import { AttachmentUploader } from './AttachmentUploader'
import { AttachmentList } from './AttachmentList'
import { Attachment } from '@/types/attachment'

interface AnnotationFormProps {
  annotation?: {
    id: string
    content: string
    author?: User | null
    guestName?: string | null
    guestEmail?: string | null
    attachments?: Attachment[]
  }
  isGuest?: boolean
  onSave: (data: {
    content: string
    guestName?: string
    guestEmail?: string
    attachments?: Attachment[]
    mentions?: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  placeholder?: string
  allowAttachments?: boolean
  projectCollaborators?: User[]
}

export function AnnotationForm({
  annotation,
  isGuest = false,
  onSave,
  onCancel,
  isLoading = false,
  placeholder = 'Add your comment...',
  allowAttachments = true,
  projectCollaborators = []
}: AnnotationFormProps) {
  const [content, setContent] = useState(annotation?.content || '')
  const [guestName, setGuestName] = useState(annotation?.guestName || '')
  const [guestEmail, setGuestEmail] = useState(annotation?.guestEmail || '')
  const [attachments, setAttachments] = useState<Attachment[]>(annotation?.attachments || [])
  const [mentions, setMentions] = useState<string[]>([])
  const [error, setError] = useState<string>()
  const [showAttachments, setShowAttachments] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus and resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (isGuest && !guestName.trim()) {
      setError('Name is required')
      return
    }

    try {
      setError(undefined)
      await onSave({
        content: content.trim(),
        ...(isGuest && {
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || undefined
        }),
        attachments,
        mentions
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save comment')
    }
  }



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as React.FormEvent)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Guest Information */}
      {isGuest && (
        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="Your name *"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Your email (optional)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Comment Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
          rows={3}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500">
              Type @ to mention collaborators • {isGuest ? 'Cmd/Ctrl + Enter to save' : 'Cmd/Ctrl + Enter to save, Esc to cancel'}
            </p>
            {allowAttachments && (
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                📎 {showAttachments ? 'Hide' : 'Add'} attachments
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {content.length}/1000
          </span>
        </div>
      </div>

      {/* Attachments Section */}
      {allowAttachments && showAttachments && (
        <div className="space-y-3">
          <AttachmentUploader
            onAttachmentUploaded={(attachment) => {
              setAttachments(prev => [...prev, {
                ...attachment,
                mimeType: attachment.fileType,
                size: attachment.fileSize,
                createdAt: new Date().toISOString()
              }])
            }}
            onError={(error) => setError(error)}
            className="border-t pt-3"
          />
          
          {attachments.length > 0 && (
            <AttachmentList
              attachments={attachments.map(att => ({
                ...att,
                createdAt: new Date().toISOString()
              }))}
              onDelete={(attachmentId) => {
                setAttachments(prev => prev.filter(att => att.id !== attachmentId))
              }}
              showUploader={false}
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
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !content.trim() || (isGuest && !guestName.trim())}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : annotation ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}