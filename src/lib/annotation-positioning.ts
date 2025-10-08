/**
 * Utilities for handling annotation positioning across viewport changes
 */

export interface ViewportDimensions {
  width: number
  height: number
}

export interface AnnotationPosition {
  x: number
  y: number
}

/**
 * Get viewport dimensions for a given viewport type
 */
export function getViewportDimensions(viewport: 'DESKTOP' | 'TABLET' | 'MOBILE', containerWidth: number): ViewportDimensions {
  switch (viewport) {
    case 'DESKTOP':
      return { width: containerWidth, height: 0 } // Height is dynamic
    case 'TABLET':
      return { width: 768, height: 1024 }
    case 'MOBILE':
      return { width: 390, height: 844 }
    default:
      return { width: containerWidth, height: 0 }
  }
}

/**
 * Convert absolute position to relative position (percentage-based)
 */
export function absoluteToRelative(
  position: AnnotationPosition,
  viewportDimensions: ViewportDimensions
): { x: number; y: number } {
  return {
    x: viewportDimensions.width > 0 ? (position.x / viewportDimensions.width) * 100 : 0,
    y: viewportDimensions.height > 0 ? (position.y / viewportDimensions.height) * 100 : position.y
  }
}

/**
 * Convert relative position (percentage-based) to absolute position
 */
export function relativeToAbsolute(
  relativePosition: { x: number; y: number },
  viewportDimensions: ViewportDimensions
): AnnotationPosition {
  return {
    x: (relativePosition.x / 100) * viewportDimensions.width,
    y: viewportDimensions.height > 0 ? (relativePosition.y / 100) * viewportDimensions.height : relativePosition.y
  }
}

/**
 * Adjust annotation positions when viewport changes
 */
export function adjustAnnotationPositions(
  annotations: Array<{ id: string; position: AnnotationPosition }>,
  fromViewport: 'DESKTOP' | 'TABLET' | 'MOBILE',
  toViewport: 'DESKTOP' | 'TABLET' | 'MOBILE',
  containerWidth: number
): Array<{ id: string; position: AnnotationPosition }> {
  if (fromViewport === toViewport) return annotations

  const fromDimensions = getViewportDimensions(fromViewport, containerWidth)
  const toDimensions = getViewportDimensions(toViewport, containerWidth)

  return annotations.map(annotation => {
    // Convert to relative position based on original viewport
    const relativePosition = absoluteToRelative(annotation.position, fromDimensions)
    
    // Convert back to absolute position for new viewport
    const newPosition = relativeToAbsolute(relativePosition, toDimensions)

    return {
      ...annotation,
      position: newPosition
    }
  })
}

/**
 * Check if annotation position is within viewport bounds
 */
export function isPositionInBounds(
  position: AnnotationPosition,
  viewportDimensions: ViewportDimensions
): boolean {
  return (
    position.x >= 0 &&
    position.x <= viewportDimensions.width &&
    position.y >= 0 &&
    (viewportDimensions.height === 0 || position.y <= viewportDimensions.height)
  )
}

/**
 * Clamp annotation position to viewport bounds
 */
export function clampPositionToBounds(
  position: AnnotationPosition,
  viewportDimensions: ViewportDimensions
): AnnotationPosition {
  return {
    x: Math.max(0, Math.min(position.x, viewportDimensions.width)),
    y: Math.max(0, viewportDimensions.height > 0 ? Math.min(position.y, viewportDimensions.height) : position.y)
  }
}