'use client'

import { User } from '@prisma/client'

interface AnnotationSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  annotations: any[]
  selectedAnnotation?: string
  onAnnotationSelect: (id: string) => void
  onAnnotationResolve: (id: string) => void
  onAnnotationDelete: (id: string) => void
  currentUser: User
  projectCollaborators: User[]
}

export function AnnotationSidebar({
  isCollapsed,
  onToggleCollapse,
  annotations,
  selectedAnnotation,
  onAnnotationSelect,
  onAnnotationResolve,
  onAnnotationDelete,
  currentUser,
  projectCollaborators
}: AnnotationSidebarProps) {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Annotations</h2>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          Active ({annotations.filter(a => a.status === 'OPEN').length})
        </button>
        <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
          Resolved ({annotations.filter(a => a.status === 'RESOLVED').length})
        </button>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No annotations yet</h3>
            <p className="text-sm text-gray-500">Switch to Comment Mode and click on the website to add annotations</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {annotations.map((annotation, index) => (
              <div
                key={annotation.id}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedAnnotation === annotation.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => onAnnotationSelect(annotation.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{annotation.content || 'Click to add comment...'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {annotation.author?.name || annotation.guestName || 'Anonymous'} • {new Date(annotation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}