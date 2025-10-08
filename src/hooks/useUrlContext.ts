'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { UrlHistoryManager, UrlContext, validateUrlAccessibility } from '@/lib/url-context'

interface UseUrlContextOptions {
  baseUrl: string
  onUrlChange?: (url: string, context: UrlContext) => void
  trackingEnabled?: boolean
}

interface UseUrlContextReturn {
  currentUrl: string
  currentContext: UrlContext
  history: UrlContext[]
  isAtBaseUrl: boolean
  canAccessContent: boolean
  isValidUrl: boolean
  error?: string
  setCurrentUrl: (url: string, title?: string) => void
  validateUrl: (url: string) => Promise<boolean>
  getBreadcrumb: () => string[]
  clearHistory: () => void
}

export function useUrlContext({
  baseUrl,
  onUrlChange,
  trackingEnabled = true
}: UseUrlContextOptions): UseUrlContextReturn {
  const historyManagerRef = useRef<UrlHistoryManager | undefined>(undefined)
  const [currentUrl, setCurrentUrlState] = useState(baseUrl)
  const [currentContext, setCurrentContext] = useState<UrlContext>(() => ({
    url: baseUrl,
    domain: '',
    path: '',
    timestamp: new Date().toISOString()
  }))
  const [history, setHistory] = useState<UrlContext[]>([])
  const [canAccessContent, setCanAccessContent] = useState(true)
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [error, setError] = useState<string>()

  // Initialize history manager
  useEffect(() => {
    if (!historyManagerRef.current) {
      historyManagerRef.current = new UrlHistoryManager(baseUrl)
      setHistory(historyManagerRef.current.getHistory())
      setCurrentContext(historyManagerRef.current.getCurrentContext())
    }
  }, [baseUrl])

  // Validate URL accessibility
  const validateUrl = useCallback(async (url: string): Promise<boolean> => {
    try {
      const validation = await validateUrlAccessibility(url)
      setIsValidUrl(validation.isValid)
      setCanAccessContent(validation.canEmbed)
      setError(validation.error)
      return validation.isValid && validation.canEmbed
    } catch {
      setIsValidUrl(false)
      setCanAccessContent(false)
      setError('Failed to validate URL')
      return false
    }
  }, [])

  // Set current URL and update context
  const setCurrentUrl = useCallback((url: string, title?: string) => {
    if (!trackingEnabled) return

    setCurrentUrlState(url)
    
    if (historyManagerRef.current) {
      historyManagerRef.current.addUrl(url, title)
      const newContext = historyManagerRef.current.getCurrentContext()
      setCurrentContext(newContext)
      setHistory(historyManagerRef.current.getHistory())
      
      // Notify parent component
      onUrlChange?.(url, newContext)
    }

    // Validate the new URL
    validateUrl(url)
  }, [trackingEnabled, onUrlChange, validateUrl])

  // Get breadcrumb navigation
  const getBreadcrumb = useCallback((): string[] => {
    return historyManagerRef.current?.getBreadcrumb() || []
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    if (historyManagerRef.current) {
      historyManagerRef.current = new UrlHistoryManager(baseUrl)
      setHistory(historyManagerRef.current.getHistory())
      setCurrentContext(historyManagerRef.current.getCurrentContext())
      setCurrentUrlState(baseUrl)
    }
  }, [baseUrl])

  // Check if at base URL
  const isAtBaseUrl = historyManagerRef.current?.isAtBaseUrl() ?? true

  // Validate initial URL
  useEffect(() => {
    validateUrl(baseUrl)
  }, [baseUrl, validateUrl])

  return {
    currentUrl,
    currentContext,
    history,
    isAtBaseUrl,
    canAccessContent,
    isValidUrl,
    error,
    setCurrentUrl,
    validateUrl,
    getBreadcrumb,
    clearHistory
  }
}