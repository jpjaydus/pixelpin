'use client'

import { useState, useRef } from 'react'

interface Annotation {
  id: string
  position: { x: number; y: number }
  status: string
  pageUrl: string
}

interface AnnotationOverlayProps {
  isActive: boolean
  onAnnotationCreate: (position: { x: number; y: number }) => void
  onAnnotationSelect: (annotationId: string) => void
  annotations: Annotation[]
  selectedAnnotation?: string
  currentPageUrl: string
  viewport?: 'DESKTOP' | 'TABLET' | 'MOBILE'
}

export function AnnotationOverlay({
  isActive,
  onAnnotationCreate,
  onAnnotationSelect,
  annotations,
  selectedAnnotation,
  currentPageUrl,
  viewport = 'DESKTOP'
}: AnnotationOverlayProps) {
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Filter annotations for current page URL
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageUrl === currentPageUrl
  )

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (!isActive || !overlayRef.current) return

    // Prevent creating annotation if clicking on an existing pin
    const target = event.target as HTMLElement
    if (target.closest('.annotation-pin')) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Ensure position is within bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setIsCreatingAnnotation(true)
      onAnnotationCreate({ x, y })
      
      // Reset creating state after a short delay
      setTimeout(() => setIsCreatingAnnotation(false), 500)
    }
  }

  const handlePinClick = (event: React.MouseEvent, annotationId: string) => {
    event.stopPropagation()
    onAnnotationSelect(annotationId)
  }

  return (
    <>
      {/* Comment Mode Overlay */}
      {isActive && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleOverlayClick}
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.01)', // Nearly transparent overlay
            cursor: isCreatingAnnotation ? 'wait' : 'crosshair'
          }}
          title="Click to add annotation"
        />
      )}

      {/* Annotation Pins - Always visible when there are annotations for current page */}
      {currentPageAnnotations.map((annotation, index) => (
        <div
          key={annotation.id}
          className={`
            annotation-pin absolute w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 z-20
            ${selectedAnnotation === annotation.id 
              ? 'ring-4 ring-blue-300 bg-blue-700 scale-110' 
              : 'hover:bg-blue-700'
            }
          `}
          style={{
            left: annotation.position.x,
            top: annotation.position.y
          }}
          onClick={(e) => handlePinClick(e, annotation.id)}
          title={`Annotation ${index + 1} - Click to view details`}
        >
          {index + 1}
        </div>
      ))}

      {/* Mode indicator for Comment Mode */}
      {isActive && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-30 pointer-events-none">
          Comment Mode - Click to add annotation
        </div>
      )}
    </>
  )
}