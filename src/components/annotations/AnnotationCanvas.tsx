'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface AnnotationCanvasProps {
  assetUrl: string
  assetType: 'IMAGE' | 'PDF' | 'URL'
  annotations: Array<{
    id: string
    type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
    position: {
      x: number
      y: number
      width?: number
      height?: number
    }
    content: string
  }>
  selectedTool: 'select' | 'comment' | 'rectangle' | 'arrow' | 'text'
  onAnnotationCreate: (annotation: {
    position: { x: number; y: number; width?: number; height?: number }
    content: string
    type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
  }) => void
  onAnnotationSelect: (annotationId: string | null) => void
  selectedAnnotationId: string | null
}

export default function AnnotationCanvas({
  assetUrl,
  assetType,
  annotations,
  selectedTool,
  onAnnotationCreate,
  onAnnotationSelect,
  selectedAnnotationId,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
    })

    fabricCanvasRef.current = canvas

    // Load asset based on type
    if (assetType === 'IMAGE') {
      fabric.Image.fromURL(assetUrl, (img) => {
        if (!img) return
        
        // Scale image to fit canvas while maintaining aspect ratio
        const canvasWidth = canvas.getWidth()
        const canvasHeight = canvas.getHeight()
        const imgWidth = img.width || 1
        const imgHeight = img.height || 1
        
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
        
        img.scale(scale)
        img.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          selectable: false,
          evented: false,
        })
        
        canvas.add(img)
        canvas.sendToBack(img)
        canvas.renderAll()
      })
    }

    // Handle canvas interactions
    const handleMouseDown = (e: fabric.IEvent) => {
      if (!fabricCanvasRef.current || selectedTool === 'select') return

      const canvas = fabricCanvasRef.current
      const pointer = canvas.getPointer(e.e)
      
      setIsDrawing(true)
      setStartPoint(pointer)

      if (selectedTool === 'comment') {
        // Create comment pin immediately
        const content = prompt('Enter your comment:')
        if (content) {
          onAnnotationCreate({
            position: { x: pointer.x, y: pointer.y },
            content,
            type: 'COMMENT',
          })
        }
        setIsDrawing(false)
      }
    }

    const handleMouseMove = (e: fabric.IEvent) => {
      if (!fabricCanvasRef.current || !isDrawing || !startPoint) return

      const canvas = fabricCanvasRef.current
      const pointer = canvas.getPointer(e.e)

      // Show preview for rectangle and arrow tools
      if (selectedTool === 'rectangle' || selectedTool === 'arrow') {
        // Remove previous preview
        const preview = canvas.getObjects().find(obj => obj.data?.isPreview)
        if (preview) canvas.remove(preview)

        // Add new preview
        if (selectedTool === 'rectangle') {
          const rect = new fabric.Rect({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            width: Math.abs(pointer.x - startPoint.x),
            height: Math.abs(pointer.y - startPoint.y),
            fill: 'transparent',
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            data: { isPreview: true },
          })
          canvas.add(rect)
        }

        canvas.renderAll()
      }
    }

    const handleMouseUp = (e: fabric.IEvent) => {
      if (!fabricCanvasRef.current || !isDrawing || !startPoint) return

      const canvas = fabricCanvasRef.current
      const pointer = canvas.getPointer(e.e)

      // Remove preview
      const preview = canvas.getObjects().find(obj => obj.data?.isPreview)
      if (preview) canvas.remove(preview)

      if (selectedTool === 'rectangle') {
        const width = Math.abs(pointer.x - startPoint.x)
        const height = Math.abs(pointer.y - startPoint.y)
        
        if (width > 10 && height > 10) {
          onAnnotationCreate({
            position: {
              x: Math.min(startPoint.x, pointer.x),
              y: Math.min(startPoint.y, pointer.y),
              width,
              height,
            },
            content: '',
            type: 'RECTANGLE',
          })
        }
      } else if (selectedTool === 'arrow') {
        const distance = Math.sqrt(
          Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)
        )
        
        if (distance > 20) {
          onAnnotationCreate({
            position: {
              x: startPoint.x,
              y: startPoint.y,
              width: pointer.x - startPoint.x,
              height: pointer.y - startPoint.y,
            },
            content: '',
            type: 'ARROW',
          })
        }
      } else if (selectedTool === 'text') {
        const content = prompt('Enter text:')
        if (content) {
          onAnnotationCreate({
            position: { x: pointer.x, y: pointer.y },
            content,
            type: 'TEXT',
          })
        }
      }

      setIsDrawing(false)
      setStartPoint(null)
      canvas.renderAll()
    }

    const handleSelection = (e: fabric.IEvent) => {
      const target = e.target
      if (target?.data?.annotationId) {
        onAnnotationSelect(target.data.annotationId)
      }
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => onAnnotationSelect(null))

    return () => {
      canvas.dispose()
    }
  }, [assetUrl, assetType, selectedTool, isDrawing, startPoint, onAnnotationCreate, onAnnotationSelect])

  // Update annotations on canvas when they change
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    
    // Remove existing annotation objects (keep background image)
    const objects = canvas.getObjects().filter(obj => obj.data?.isAnnotation)
    objects.forEach(obj => canvas.remove(obj))

    // Add annotation objects
    annotations.forEach(annotation => {
      const { position, type, id, content } = annotation
      
      switch (type) {
        case 'COMMENT':
          addCommentPin(canvas, position, id)
          break
        case 'RECTANGLE':
          addRectangle(canvas, position, id)
          break
        case 'ARROW':
          addArrow(canvas, position, id)
          break
        case 'TEXT':
          addTextAnnotation(canvas, position, id, content)
          break
      }
    })

    canvas.renderAll()
  }, [annotations])



  const addCommentPin = (canvas: fabric.Canvas, position: { x: number; y: number }, id: string) => {
    const circle = new fabric.Circle({
      left: position.x - 10,
      top: position.y - 10,
      radius: 10,
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2,
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    const text = new fabric.Text('💬', {
      left: position.x - 6,
      top: position.y - 8,
      fontSize: 12,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    })

    const group = new fabric.Group([circle, text], {
      left: position.x - 10,
      top: position.y - 10,
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    canvas.add(group)
  }

  const addRectangle = (canvas: fabric.Canvas, position: { x: number; y: number; width?: number; height?: number }, id: string) => {
    const rect = new fabric.Rect({
      left: position.x,
      top: position.y,
      width: position.width || 100,
      height: position.height || 100,
      fill: 'transparent',
      stroke: '#ef4444',
      strokeWidth: 2,
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    canvas.add(rect)
  }

  const addArrow = (canvas: fabric.Canvas, position: { x: number; y: number; width?: number; height?: number }, id: string) => {
    const startX = position.x
    const startY = position.y
    const endX = position.x + (position.width || 100)
    const endY = position.y + (position.height || 0)

    const line = new fabric.Line([startX, startY, endX, endY], {
      stroke: '#f59e0b',
      strokeWidth: 3,
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    // Add arrowhead
    const angle = Math.atan2(endY - startY, endX - startX)
    const arrowLength = 15
    const arrowAngle = Math.PI / 6

    const arrowHead = new fabric.Polygon([
      { x: endX, y: endY },
      {
        x: endX - arrowLength * Math.cos(angle - arrowAngle),
        y: endY - arrowLength * Math.sin(angle - arrowAngle),
      },
      {
        x: endX - arrowLength * Math.cos(angle + arrowAngle),
        y: endY - arrowLength * Math.sin(angle + arrowAngle),
      },
    ], {
      fill: '#f59e0b',
      selectable: false,
      evented: false,
    })

    const group = new fabric.Group([line, arrowHead], {
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    canvas.add(group)
  }

  const addTextAnnotation = (canvas: fabric.Canvas, position: { x: number; y: number }, id: string, content: string) => {
    const text = new fabric.Text(content, {
      left: position.x,
      top: position.y,
      fontSize: 16,
      fill: '#1f2937',
      backgroundColor: '#fef3c7',
      padding: 8,
      selectable: true,
      data: { isAnnotation: true, annotationId: id },
    })

    canvas.add(text)
  }

  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return
    const newZoom = Math.min(zoom * 1.2, 3)
    setZoom(newZoom)
    fabricCanvasRef.current.setZoom(newZoom)
    fabricCanvasRef.current.renderAll()
  }

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return
    const newZoom = Math.max(zoom / 1.2, 0.1)
    setZoom(newZoom)
    fabricCanvasRef.current.setZoom(newZoom)
    fabricCanvasRef.current.renderAll()
  }

  const handleResetZoom = () => {
    if (!fabricCanvasRef.current) return
    setZoom(1)
    fabricCanvasRef.current.setZoom(1)
    fabricCanvasRef.current.renderAll()
  }

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block max-w-full max-h-full"
      />
    </div>
  )
}