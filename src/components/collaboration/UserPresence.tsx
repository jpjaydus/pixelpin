'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'

interface User {
  id: string
  user_info: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface UserPresenceProps {
  users: User[]
  currentUserId: string
}

export default function UserPresence({ users, currentUserId }: UserPresenceProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Filter out current user
  const otherUsers = users.filter(user => user.id !== currentUserId)

  if (otherUsers.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Users className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">
          {otherUsers.length} online
        </span>
        
        {/* User avatars */}
        <div className="flex -space-x-2">
          {otherUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs font-medium text-white"
              title={user.user_info.name || user.user_info.email}
            >
              {user.user_info.image ? (
                <img
                  src={user.user_info.image}
                  alt={user.user_info.name || user.user_info.email}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (user.user_info.name || user.user_info.email)[0].toUpperCase()
              )}
            </div>
          ))}
          {otherUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
              +{otherUsers.length - 3}
            </div>
          )}
        </div>
      </button>

      {/* Expanded user list */}
      {isExpanded && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-48">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Online Users
          </div>
          {otherUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white">
                {user.user_info.image ? (
                  <img
                    src={user.user_info.image}
                    alt={user.user_info.name || user.user_info.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (user.user_info.name || user.user_info.email)[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_info.name || user.user_info.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.user_info.email}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}