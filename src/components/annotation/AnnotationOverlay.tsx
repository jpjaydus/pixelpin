'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Annotation {
  id: string
  position: { x: number; y: number }
  status: string
  pageUrl: string
  content?: string
}

interface AnnotationOverlayProps {
  isActive: boolean
  onAnnotationCreate: (position: { x: number; y: number }) => void
  onAnnotationSelect: (annotationId: string) => void
  annotations: Annotation[]
  selectedAnnotation?: string
  currentPageUrl: string
  viewport?: 'DESKTOP' | 'TABLET' | 'MOBILE'
  iframeRef?: React.RefObject<HTMLIFrameElement>
}

export function AnnotationOverlay({
  isActive,
  onAnnotationCreate,
  onAnnotationSelect,
  annotations,
  selectedAnnotation,
  currentPageUrl,
  viewport = 'DESKTOP',
  iframeRef
}: AnnotationOverlayProps) {
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Filter annotations for current page URL
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageUrl === currentPageUrl
  )

  // Calculate precise coordinates relative to iframe content
  const getRelativeCoordinates = useCallback((event: React.MouseEvent): { x: number; y: number } | null => {
    if (!overlayRef.current || !iframeRef?.current) return null

    const iframeRect = iframeRef.current.getBoundingClientRect()

    // Calculate position relative to iframe
    const x = event.clientX - iframeRect.left
    const y = event.clientY - iframeRect.top

    // Ensure position is within iframe bounds
    if (x >= 0 && x <= iframeRect.width && y >= 0 && y <= iframeRect.height) {
      return { x, y }
    }

    return null
  }, [iframeRef])

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (!isActive || !overlayRef.current) return

    // Prevent creating annotation if clicking on an existing pin
    const target = event.target as HTMLElement
    if (target.closest('.annotation-pin')) return

    const coordinates = getRelativeCoordinates(event)
    if (coordinates) {
      setIsCreatingAnnotation(true)
      onAnnotationCreate(coordinates)
      
      // Reset creating state after a short delay
      setTimeout(() => setIsCreatingAnnotation(false), 500)
    }
  }

  const handleOverlayMouseMove = (event: React.MouseEvent) => {
    if (!isActive) return

    const coordinates = getRelativeCoordinates(event)
    setHoverPosition(coordinates)
  }

  const handleOverlayMouseLeave = () => {
    setHoverPosition(null)
  }

  const handlePinClick = (event: React.MouseEvent, annotationId: string) => {
    event.stopPropagation()
    onAnnotationSelect(annotationId)
  }

  // Scroll to selected annotation
  useEffect(() => {
    if (selectedAnnotation && overlayRef.current) {
      const selectedPin = overlayRef.current.querySelector(`[data-annotation-id="${selectedAnnotation}"]`)
      if (selectedPin) {
        selectedPin.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedAnnotation])

  return (
    <>
      {/* Comment Mode Overlay */}
      {isActive && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleOverlayClick}
          onMouseMove={handleOverlayMouseMove}
          onMouseLeave={handleOverlayMouseLeave}
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.01)', // Nearly transparent overlay
            cursor: isCreatingAnnotation ? 'wait' : 'crosshair'
          }}
          title="Click to add annotation"
        />
      )}

      {/* Hover indicator for Comment Mode */}
      {isActive && hoverPosition && !isCreatingAnnotation && (
        <div
          className="absolute w-6 h-6 border-2 border-blue-500 rounded-full pointer-events-none z-15 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            left: hoverPosition.x,
            top: hoverPosition.y
          }}
        />
      )}

      {/* Annotation Pins - Always visible when there are annotations for current page */}
      {currentPageAnnotations.map((annotation, index) => {
        const isSelected = selectedAnnotation === annotation.id
        const isResolved = annotation.status === 'RESOLVED'
        
        return (
          <div
            key={annotation.id}
            data-annotation-id={annotation.id}
            className={`
              annotation-pin absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 z-20
              ${isSelected 
                ? 'ring-4 ring-blue-300 scale-110' 
                : ''
              }
              ${isResolved
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
              ${isSelected && isResolved
                ? 'bg-green-700 ring-green-300'
                : isSelected
                ? 'bg-blue-700'
                : ''
              }
            `}
            style={{
              left: annotation.position.x,
              top: annotation.position.y
            }}
            onClick={(e) => handlePinClick(e, annotation.id)}
            title={`Annotation ${index + 1}${isResolved ? ' (Resolved)' : ''} - ${annotation.content || 'Click to view details'}`}
          >
            {isResolved ? '✓' : index + 1}
          </div>
        )
      })}

      {/* Mode indicator for Comment Mode */}
      {isActive && currentPageAnnotations.length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-30 pointer-events-none animate-pulse">
          Comment Mode - Click to add annotation
        </div>
      )}

      {/* Annotation count indicator */}
      {currentPageAnnotations.length > 0 && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg z-30 pointer-events-none">
          {currentPageAnnotations.length} annotation{currentPageAnnotations.length !== 1 ? 's' : ''} on this page
        </div>
      )}
    </>
  )
}