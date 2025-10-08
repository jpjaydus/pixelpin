'use client'

import { AnnotationMode } from './ImmersiveAnnotationView'

interface AnnotationModeToggleProps {
  currentMode: AnnotationMode
  onModeChange: (mode: AnnotationMode) => void
  disabled?: boolean
}

export function AnnotationModeToggle({
  currentMode,
  onModeChange,
  disabled = false
}: AnnotationModeToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1 relative">
      <button
        onClick={() => onModeChange('COMMENT')}
        disabled={disabled}
        className={`
          px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative z-10
          ${currentMode === 'COMMENT'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Comment Mode - Click to add annotations"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Comment</span>
        </div>
      </button>
      
      <button
        onClick={() => onModeChange('BROWSE')}
        disabled={disabled}
        className={`
          px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative z-10
          ${currentMode === 'BROWSE'
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Browse Mode - Navigate the website normally"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Browse</span>
        </div>
      </button>

      {/* Mode description */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none">
        {currentMode === 'COMMENT' 
          ? 'Click on website to add annotations' 
          : 'Navigate website normally'
        }
      </div>
    </div>
  )
}