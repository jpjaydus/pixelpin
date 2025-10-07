'use client'

import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function LoadingButton({ 
  children, 
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`relative ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner className="w-4 h-4 text-current" />
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  )
}