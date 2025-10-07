'use client'

import { useState } from 'react'
import { MessageCircle, Square, ArrowRight, Type, Check, Reply, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Annotation {
  id: string
  content: string
  type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  replies: Reply[]
}

interface Reply {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface AnnotationPanelProps {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  onAnnotationSelect: (annotationId: string | null) => void
  onAnnotationUpdate: (annotationId: string, updates: { status?: 'OPEN' | 'RESOLVED'; content?: string }) => void
  onAnnotationDelete: (annotationId: string) => void
  onReplyCreate: (annotationId: string, content: string) => void
  currentUserId: string
}

export default function AnnotationPanel({
  annotations,
  selectedAnnotationId,
  onAnnotationSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
  onReplyCreate,
  currentUserId,
}: AnnotationPanelProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'COMMENT':
        return MessageCircle
      case 'RECTANGLE':
        return Square
      case 'ARROW':
        return ArrowRight
      case 'TEXT':
        return Type
      default:
        return MessageCircle
    }
  }

  const handleReplySubmit = (annotationId: string) => {
    if (replyContent.trim()) {
      onReplyCreate(annotationId, replyContent.trim())
      setReplyContent('')
      setReplyingTo(null)
    }
  }

  const handleEditSubmit = (annotationId: string) => {
    if (editContent.trim()) {
      onAnnotationUpdate(annotationId, { content: editContent.trim() })
      setEditContent('')
      setEditingAnnotation(null)
    }
  }

  const startEditing = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id)
    setEditContent(annotation.content)
  }

  const openAnnotations = annotations.filter(a => a.status === 'OPEN')
  const resolvedAnnotations = annotations.filter(a => a.status === 'RESOLVED')

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Annotations</h2>
        <p className="text-sm text-gray-500 mt-1">
          {openAnnotations.length} open, {resolvedAnnotations.length} resolved
        </p>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs mt-1">Select a tool and click on the canvas to add annotations</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Open Annotations */}
            {openAnnotations.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Open ({openAnnotations.length})
                </div>
                {openAnnotations.map((annotation) => (
                  <AnnotationItem
                    key={annotation.id}
                    annotation={annotation}
                    isSelected={selectedAnnotationId === annotation.id}
                    onSelect={() => onAnnotationSelect(annotation.id)}
                    onUpdate={onAnnotationUpdate}
                    onDelete={onAnnotationDelete}
                    onReplyCreate={onReplyCreate}
                    currentUserId={currentUserId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    editingAnnotation={editingAnnotation}
                    setEditingAnnotation={setEditingAnnotation}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    onReplySubmit={handleReplySubmit}
                    onEditSubmit={handleEditSubmit}
                    onStartEditing={startEditing}
                    getAnnotationIcon={getAnnotationIcon}
                  />
                ))}
              </div>
            )}

            {/* Resolved Annotations */}
            {resolvedAnnotations.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Resolved ({resolvedAnnotations.length})
                </div>
                {resolvedAnnotations.map((annotation) => (
                  <AnnotationItem
                    key={annotation.id}
                    annotation={annotation}
                    isSelected={selectedAnnotationId === annotation.id}
                    onSelect={() => onAnnotationSelect(annotation.id)}
                    onUpdate={onAnnotationUpdate}
                    onDelete={onAnnotationDelete}
                    onReplyCreate={onReplyCreate}
                    currentUserId={currentUserId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    editingAnnotation={editingAnnotation}
                    setEditingAnnotation={setEditingAnnotation}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    onReplySubmit={handleReplySubmit}
                    onEditSubmit={handleEditSubmit}
                    onStartEditing={startEditing}
                    getAnnotationIcon={getAnnotationIcon}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface AnnotationItemProps {
  annotation: Annotation
  isSelected: boolean
  onSelect: () => void
  onUpdate: (annotationId: string, updates: { status?: 'OPEN' | 'RESOLVED'; content?: string }) => void
  onDelete: (annotationId: string) => void
  onReplyCreate: (annotationId: string, content: string) => void
  currentUserId: string
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyContent: string
  setReplyContent: (content: string) => void
  editingAnnotation: string | null
  setEditingAnnotation: (id: string | null) => void
  editContent: string
  setEditContent: (content: string) => void
  onReplySubmit: (annotationId: string) => void
  onEditSubmit: (annotationId: string) => void
  onStartEditing: (annotation: Annotation) => void
  getAnnotationIcon: (type: string) => React.ComponentType<{ className?: string }>
}

function AnnotationItem({
  annotation,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  editingAnnotation,
  setEditingAnnotation,
  editContent,
  setEditContent,
  onReplySubmit,
  onEditSubmit,
  onStartEditing,
  getAnnotationIcon,
}: AnnotationItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const Icon = getAnnotationIcon(annotation.type)
  const isOwner = annotation.author.id === currentUserId

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {/* Annotation Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${annotation.status === 'RESOLVED' ? 'text-green-600' : 'text-blue-600'}`} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
              {annotation.author.name?.[0] || annotation.author.email[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {annotation.author.name || annotation.author.email}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {annotation.status === 'RESOLVED' && (
            <Check className="w-4 h-4 text-green-600" />
          )}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartEditing(annotation)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate(annotation.id, {
                      status: annotation.status === 'OPEN' ? 'RESOLVED' : 'OPEN'
                    })
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
                >
                  {annotation.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(annotation.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Annotation Content */}
      {editingAnnotation === annotation.id ? (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
            rows={2}
            placeholder="Edit annotation..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onEditSubmit(annotation.id)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingAnnotation(null)
                setEditContent('')
              }}
              className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        annotation.content && (
          <p className="text-sm text-gray-700 mb-3">{annotation.content}</p>
        )
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-500 mb-3">
        {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
      </p>

      {/* Replies */}
      {annotation.replies.length > 0 && (
        <div className="space-y-2 mb-3">
          {annotation.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {reply.author.name?.[0] || reply.author.email[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {reply.author.name || reply.author.email}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {replyingTo === annotation.id ? (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
            rows={2}
            placeholder="Write a reply..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onReplySubmit(annotation.id)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setReplyingTo(null)
                setReplyContent('')
              }}
              className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setReplyingTo(annotation.id)
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
        >
          <Reply className="w-3 h-3" />
          Reply
        </button>
      )}
    </div>
  )
}