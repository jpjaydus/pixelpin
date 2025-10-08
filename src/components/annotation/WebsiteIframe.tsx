'use client'

import { forwardRef, useEffect, useState } from 'react'
import { ViewportType, AnnotationMode } from './ImmersiveAnnotationView'

interface WebsiteIframeProps {
  url: string
  viewport: ViewportType
  mode: AnnotationMode
  onLoad: () => void
  onUrlChange: (newUrl: string) => void
}

const viewportWidths = {
  DESKTOP: '100%',
  TABLET: '768px',
  MOBILE: '390px'
}

export const WebsiteIframe = forwardRef<HTMLIFrameElement, WebsiteIframeProps>(
  ({ url, viewport, mode, onLoad, onUrlChange }, ref) => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>()
    const [currentUrl, setCurrentUrl] = useState(url)
    const [loadAttempts, setLoadAttempts] = useState(0)
    const [canAccessContent, setCanAccessContent] = useState(true)

    const validateUrl = (urlToValidate: string): boolean => {
      try {
        const urlObj = new URL(urlToValidate)
        // Check for valid protocols
        return ['http:', 'https:'].includes(urlObj.protocol)
      } catch {
        return false
      }
    }

    const handleLoad = () => {
      setIsLoading(false)
      setError(undefined)
      setLoadAttempts(0)
      onLoad()

      // Try to track URL changes in Browse mode
      if (mode === 'BROWSE' && ref && 'current' in ref && ref.current) {
        try {
          const iframe = ref.current
          const iframeUrl = iframe.contentWindow?.location.href
          if (iframeUrl && iframeUrl !== currentUrl) {
            setCurrentUrl(iframeUrl)
            onUrlChange(iframeUrl)
          }
          setCanAccessContent(true)
        } catch (crossOriginError) {
          // Cross-origin restrictions prevent URL access
          setCanAccessContent(false)
          console.warn('Cannot access iframe URL due to cross-origin restrictions')
        }
      }
    }

    const handleError = () => {
      setIsLoading(false)
      setLoadAttempts(prev => prev + 1)
      
      if (loadAttempts < 2) {
        setError('Failed to load website. Retrying...')
        // Auto-retry after a short delay
        setTimeout(() => {
          setIsLoading(true)
          setError(undefined)
          if (ref && 'current' in ref && ref.current) {
            ref.current.src = url
          }
        }, 2000)
      } else {
        setError('Unable to load website. This may be due to security restrictions or the website blocking iframe embedding.')
      }
    }

    useEffect(() => {
      if (!validateUrl(url)) {
        setIsLoading(false)
        setError('Invalid URL format. Please provide a valid HTTP or HTTPS URL.')
        return
      }
      
      setIsLoading(true)
      setError(undefined)
      setCurrentUrl(url)
      setLoadAttempts(0)
    }, [url])

    // Set up URL tracking for Browse mode
    useEffect(() => {
      if (mode === 'BROWSE' && ref && 'current' in ref && ref.current) {
        const iframe = ref.current
        
        const checkUrlChange = () => {
          try {
            const iframeUrl = iframe.contentWindow?.location.href
            if (iframeUrl && iframeUrl !== currentUrl) {
              setCurrentUrl(iframeUrl)
              onUrlChange(iframeUrl)
            }
          } catch (crossOriginError) {
            // Try to detect navigation through other means
            try {
              // Check if iframe document has changed
              const iframeDoc = iframe.contentDocument
              if (iframeDoc && iframeDoc.readyState === 'complete') {
                const title = iframeDoc.title
                if (title && title !== document.title) {
                  // URL likely changed but we can't access it
                  console.log('Navigation detected but URL not accessible due to cross-origin restrictions')
                }
              }
            } catch (docError) {
              // Silently handle cross-origin restrictions
            }
          }
        }

        // Check for URL changes periodically in Browse mode
        const interval = setInterval(checkUrlChange, 1000)
        
        // Also listen for iframe navigation events
        const handleMessage = (event: MessageEvent) => {
          // Listen for postMessage from iframe if the site supports it
          if (event.source === iframe.contentWindow && event.data.type === 'navigation') {
            onUrlChange(event.data.url)
          }
        }
        
        window.addEventListener('message', handleMessage)
        
        return () => {
          clearInterval(interval)
          window.removeEventListener('message', handleMessage)
        }
      }
    }, [mode, currentUrl, onUrlChange, ref])

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Loading website...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Website</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsLoading(true)
                    setError(undefined)
                    setLoadAttempts(0)
                    if (ref && 'current' in ref && ref.current) {
                      ref.current.src = url
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
              {!canAccessContent && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> This website restricts iframe embedding. URL tracking may be limited in Browse mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Iframe Container with Viewport Control */}
        <div className="h-full viewport-container mx-auto flex justify-center items-center">
          <div
            className={`
              h-full bg-white relative
              ${viewport === 'DESKTOP' ? 'viewport-desktop' : ''}
              ${viewport === 'TABLET' ? 'viewport-tablet' : ''}
              ${viewport === 'MOBILE' ? 'viewport-mobile' : ''}
              viewport-transition
            `}
            style={{ 
              width: viewportWidths[viewport],
              maxWidth: '100%'
            }}
          >
            {/* Viewport Indicator */}
            {viewport !== 'DESKTOP' && (
              <div className="viewport-indicator">
                {viewport === 'TABLET' ? '768×1024' : '390×844'}
              </div>
            )}
            
            <iframe
              ref={ref}
              src={url}
              className="w-full h-full border-0 bg-white"
              style={{
                borderRadius: viewport !== 'DESKTOP' ? (viewport === 'MOBILE' ? '12px' : '8px') : '0'
              }}
              onLoad={handleLoad}
              onError={handleError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
              title="Website Preview"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    )
  }
)

WebsiteIframe.displayName = 'WebsiteIframe'