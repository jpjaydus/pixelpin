// Comprehensive error handling utilities

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  IFRAME_SECURITY = 'IFRAME_SECURITY',
  SCREENSHOT_CAPTURE = 'SCREENSHOT_CAPTURE',
  GUEST_ACCESS = 'GUEST_ACCESS',
  REAL_TIME = 'REAL_TIME',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: Record<string, unknown>
  timestamp: Date
  userMessage?: string
  recoverable?: boolean
  retryable?: boolean
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []
  private maxLogSize = 100

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  createError(
    type: ErrorType,
    message: string,
    options: {
      code?: string
      details?: Record<string, unknown>
      userMessage?: string
      recoverable?: boolean
      retryable?: boolean
    } = {}
  ): AppError {
    const error: AppError = {
      type,
      message,
      timestamp: new Date(),
      code: options.code,
      details: options.details,
      userMessage: options.userMessage || this.getDefaultUserMessage(type),
      recoverable: options.recoverable ?? this.isRecoverable(type),
      retryable: options.retryable ?? this.isRetryable(type)
    }

    this.logError(error)
    return error
  }

  private logError(error: AppError): void {
    this.errorLog.unshift(error)
    
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', error)
    }

    // In production, you might want to send to an error tracking service
    // this.sendToErrorTracking(error)
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.'
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue.'
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.'
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.'
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.'
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.'
      case ErrorType.SERVER:
        return 'Server error. Please try again later.'
      case ErrorType.IFRAME_SECURITY:
        return 'This website cannot be displayed due to security restrictions.'
      case ErrorType.SCREENSHOT_CAPTURE:
        return 'Failed to capture screenshot. You can upload one manually.'
      case ErrorType.GUEST_ACCESS:
        return 'Guest access is not available for this project.'
      case ErrorType.REAL_TIME:
        return 'Real-time connection lost. Trying to reconnect...'
      case ErrorType.BROWSER_COMPATIBILITY:
        return 'Your browser doesn\'t support this feature. Please use a modern browser.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  private isRecoverable(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.RATE_LIMIT,
      ErrorType.SCREENSHOT_CAPTURE,
      ErrorType.REAL_TIME
    ].includes(type)
  }

  private isRetryable(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER,
      ErrorType.SCREENSHOT_CAPTURE,
      ErrorType.REAL_TIME
    ].includes(type)
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(0, limit)
  }

  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Error boundary hook for React components
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance()

  const handleError = (
    error: Error | AppError,
    errorInfo?: { componentStack?: string }
  ) => {
    if (error && typeof error === 'object' && 'type' in error) {
      // Already an AppError
      return error as AppError
    }

    // Convert regular Error to AppError
    let type = ErrorType.CLIENT
    const errorObj = error as Error

    // Classify error based on message or other properties
    if (errorObj.message?.includes('fetch')) {
      type = ErrorType.NETWORK
    } else if (errorObj.message?.includes('Unauthorized')) {
      type = ErrorType.AUTHENTICATION
    } else if (errorObj.message?.includes('Forbidden')) {
      type = ErrorType.AUTHORIZATION
    }

    return errorHandler.createError(type, errorObj.message || 'Unknown error', {
      details: { stack: errorObj.stack, componentStack: errorInfo?.componentStack }
    })
  }

  return { handleError, errorHandler }
}

// Network error handling
export async function handleApiRequest<T>(
  request: () => Promise<Response>
): Promise<T> {
  const errorHandler = ErrorHandler.getInstance()

  try {
    const response = await request()

    if (!response.ok) {
      let type = ErrorType.SERVER
      let message = `HTTP ${response.status}: ${response.statusText}`

      switch (response.status) {
        case 401:
          type = ErrorType.AUTHENTICATION
          message = 'Authentication required'
          break
        case 403:
          type = ErrorType.AUTHORIZATION
          message = 'Access denied'
          break
        case 404:
          type = ErrorType.NOT_FOUND
          message = 'Resource not found'
          break
        case 429:
          type = ErrorType.RATE_LIMIT
          message = 'Rate limit exceeded'
          break
        case 400:
          type = ErrorType.VALIDATION
          message = 'Invalid request'
          break
      }

      const error = errorHandler.createError(type, message, {
        code: response.status.toString(),
        details: { url: response.url, status: response.status }
      })

      throw error
    }

    return await response.json()
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      throw error // Already handled
    }

    // Network or parsing error
    const appError = errorHandler.createError(
      ErrorType.NETWORK,
      'Network request failed',
      {
        details: { originalError: error instanceof Error ? error.message : String(error) }
      }
    )

    throw appError
  }
}

// Screenshot capture error handling
export function handleScreenshotError(error: Error): AppError {
  const errorHandler = ErrorHandler.getInstance()

  let message = 'Screenshot capture failed'
  let recoverable = true

  if (error.message.includes('cross-origin')) {
    message = 'Cannot capture screenshot due to cross-origin restrictions'
    recoverable = false
  } else if (error.message.includes('canvas')) {
    message = 'Canvas API not available for screenshot capture'
  } else if (error.message.includes('permission')) {
    message = 'Permission denied for screenshot capture'
  }

  return errorHandler.createError(ErrorType.SCREENSHOT_CAPTURE, message, {
    details: { originalError: error.message },
    recoverable
  })
}

// Iframe security error handling
export function handleIframeError(error: Error, url: string): AppError {
  const errorHandler = ErrorHandler.getInstance()

  let message = 'Failed to load website'
  let userMessage = 'This website cannot be displayed'

  if (error.message.includes('X-Frame-Options')) {
    message = 'Website blocks iframe embedding (X-Frame-Options)'
    userMessage = 'This website doesn\'t allow embedding. Try opening it in a new tab.'
  } else if (error.message.includes('CSP')) {
    message = 'Content Security Policy blocks iframe'
    userMessage = 'This website\'s security policy prevents embedding.'
  } else if (error.message.includes('CORS')) {
    message = 'Cross-origin request blocked'
    userMessage = 'Cross-origin restrictions prevent loading this website.'
  }

  return errorHandler.createError(ErrorType.IFRAME_SECURITY, message, {
    details: { url, originalError: error.message },
    userMessage,
    recoverable: false
  })
}

// Guest access error handling
export function handleGuestAccessError(error: Error): AppError {
  const errorHandler = ErrorHandler.getInstance()

  let message = 'Guest access error'
  let userMessage = 'Guest access is not available'

  if (error.message.includes('token')) {
    message = 'Invalid or expired guest token'
    userMessage = 'This guest link is invalid or has expired. Please request a new link.'
  } else if (error.message.includes('disabled')) {
    message = 'Guest access is disabled for this project'
    userMessage = 'Guest access has been disabled for this project.'
  }

  return errorHandler.createError(ErrorType.GUEST_ACCESS, message, {
    details: { originalError: error.message },
    userMessage,
    recoverable: false
  })
}

// Real-time connection error handling
export function handleRealtimeError(error: Error): AppError {
  const errorHandler = ErrorHandler.getInstance()

  return errorHandler.createError(ErrorType.REAL_TIME, 'Real-time connection error', {
    details: { originalError: error.message },
    retryable: true,
    recoverable: true
  })
}

// Browser compatibility checking
export function checkBrowserCompatibility(): AppError | null {
  const errorHandler = ErrorHandler.getInstance()

  const requiredFeatures = [
    { name: 'fetch', check: () => typeof fetch !== 'undefined' },
    { name: 'IntersectionObserver', check: () => typeof IntersectionObserver !== 'undefined' },
    { name: 'ResizeObserver', check: () => typeof ResizeObserver !== 'undefined' },
    { name: 'WebSocket', check: () => typeof WebSocket !== 'undefined' },
    { name: 'Canvas', check: () => {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext && canvas.getContext('2d'))
    }}
  ]

  const missingFeatures = requiredFeatures
    .filter(feature => !feature.check())
    .map(feature => feature.name)

  if (missingFeatures.length > 0) {
    return errorHandler.createError(
      ErrorType.BROWSER_COMPATIBILITY,
      `Missing browser features: ${missingFeatures.join(', ')}`,
      {
        details: { missingFeatures },
        recoverable: false
      }
    )
  }

  return null
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return

  const errorHandler = ErrorHandler.getInstance()

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = errorHandler.createError(
      ErrorType.CLIENT,
      'Unhandled promise rejection',
      {
        details: { reason: event.reason }
      }
    )
    
    console.error('Unhandled promise rejection:', error)
    event.preventDefault()
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = errorHandler.createError(
      ErrorType.CLIENT,
      'Global error',
      {
        details: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      }
    )
    
    console.error('Global error:', error)
  })
}