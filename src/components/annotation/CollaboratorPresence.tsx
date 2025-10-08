'use client'

import { useState } from 'react'

interface CollaboratorCursor {
  userId: string
  userName: string
  x: number
  y: number
  timestamp: number
}

interface OnlineCollaborator {
  id: string
  user_info: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface CollaboratorPresenceProps {
  cursors: Map<string, CollaboratorCursor>
  onlineCollaborators: OnlineCollaborator[]
  currentUserId: string
  isVisible: boolean
  onToggleVisibility: () => void
}

export function CollaboratorPresence({
  cursors,
  onlineCollaborators,
  currentUserId,
  isVisible,
  onToggleVisibility
}: CollaboratorPresenceProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Filter out current user and get active collaborators
  const activeCollaborators = onlineCollaborators.filter(
    collab => collab.user_info.id !== currentUserId
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserColor = (userId: string) => {
    // Generate consistent color for each user
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ]
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <>
      {/* Presence Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleVisibility}
              className={`p-1 rounded transition-colors ${
                isVisible ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={isVisible ? 'Hide collaborator cursors' : 'Show collaborator cursors'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* Online Collaborators */}
            <div className="flex items-center space-x-1">
              {activeCollaborators.slice(0, 3).map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="relative"
                  title={collaborator.user_info.name || collaborator.user_info.email}
                >
                  {collaborator.user_info.image ? (
                    <img
                      src={collaborator.user_info.image}
                      alt={collaborator.user_info.name || collaborator.user_info.email}
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white ${getUserColor(collaborator.user_info.id)}`}>
                      {getInitials(collaborator.user_info.name || collaborator.user_info.email)}
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                </div>
              ))}
              
              {activeCollaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{activeCollaborators.length - 3}
                </div>
              )}
              
              {activeCollaborators.length === 0 && (
                <span className="text-xs text-gray-500 px-2">No one else online</span>
              )}
            </div>

            {/* Details Toggle */}
            {activeCollaborators.length > 0 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Show collaborator details"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Collaborator Details */}
          {showDetails && activeCollaborators.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
              {activeCollaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${getUserColor(collaborator.user_info.id)}`}></div>
                  <span className="text-gray-700">
                    {collaborator.user_info.name || collaborator.user_info.email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collaborator Cursors */}
      {isVisible && Array.from(cursors.values()).map((cursor) => {
        const collaborator = activeCollaborators.find(c => c.user_info.id === cursor.userId)
        if (!collaborator) return null

        // Hide cursors older than 5 seconds
        if (Date.now() - cursor.timestamp > 5000) return null

        return (
          <div
            key={cursor.userId}
            className="fixed pointer-events-none z-40 transition-all duration-100"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor */}
            <div className="relative">
              <svg
                className={`w-5 h-5 ${getUserColor(cursor.userId).replace('bg-', 'text-')}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10.07 14.27c.13.13.3.2.49.2a.64.64 0 00.49-.2l6.44-6.44a.78.78 0 000-1.1L9.56.8a.78.78 0 00-1.1 0L2.2 7.07a.78.78 0 000 1.1l5.93 5.93c.14.14.3.2.49.2a.64.64 0 00.49-.2z"/>
              </svg>
              
              {/* User name label */}
              <div className={`absolute top-5 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap ${getUserColor(cursor.userId)}`}>
                {cursor.userName}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}