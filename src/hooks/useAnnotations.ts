'use client'

import { useState, useEffect } from 'react'

interface Annotation {
  id: string
  assetId: string
  authorId?: string
  position: { x: number; y: number }
  content: string
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
  updatedAt: string
  screenshot: string
  pageUrl: string
  metadata: Record<string, unknown>
  guestName?: string
  guestEmail?: string
  author?: {
    id: string
    name: string
    email: string
  }
  replies: Array<{
    id: string
    content: string
    authorId: string
    createdAt: string
    author: {
      id: string
      name: string
      email: string
    }
  }>
  attachments: Array<{
    id: string
    filename: string
    url: string
    mimeType: string
    size: number
  }>
  mentions: Array<{
    id: string
    userId: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

interface CreateAnnotationData {
  position: { x: number; y: number }
  content: string
  screenshot: string
  pageUrl: string
  metadata: Record<string, unknown>
  mentions?: string[]
  attachments?: Array<{
    id: string
    filename: string
    url: string
    fileType: string
    fileSize: number
  }>
}

export function useAnnotations(assetId: string, currentUrl: string) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  // Filter annotations by current URL
  const filteredAnnotations = annotations.filter(
    annotation => annotation.pageUrl === currentUrl
  )

  const createAnnotation = async (data: CreateAnnotationData) => {
    try {
      const response = await fetch(`/api/assets/${assetId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create annotation')
      }

      const newAnnotation = await response.json()
      setAnnotations(prev => [...prev, newAnnotation])
      return newAnnotation
    } catch (error) {
      console.error('Error creating annotation:', error)
      throw error
    }
  }

  const updateAnnotation = async (id: string, data: Partial<Annotation>) => {
    try {
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update annotation')
      }

      const updatedAnnotation = await response.json()
      setAnnotations(prev => 
        prev.map(annotation => 
          annotation.id === id ? updatedAnnotation : annotation
        )
      )
      return updatedAnnotation
    } catch (error) {
      console.error('Error updating annotation:', error)
      throw error
    }
  }

  const deleteAnnotation = async (id: string) => {
    try {
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete annotation')
      }

      setAnnotations(prev => prev.filter(annotation => annotation.id !== id))
    } catch (error) {
      console.error('Error deleting annotation:', error)
      throw error
    }
  }

  const addReply = async (annotationId: string, data: {
    content: string
    attachments?: {
      id: string
      filename: string
      url: string
      fileType: string
      fileSize: number
    }[]
  }) => {
    try {
      const response = await fetch(`/api/annotations/${annotationId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to add reply')
      }

      const newReply = await response.json()
      
      // Update the annotation with the new reply
      setAnnotations(prev => 
        prev.map(annotation => 
          annotation.id === annotationId 
            ? { ...annotation, replies: [...(annotation.replies || []), newReply] }
            : annotation
        )
      )
      
      return newReply
    } catch (error) {
      console.error('Error adding reply:', error)
      throw error
    }
  }

  // Load annotations on mount
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/assets/${assetId}/annotations`)
        
        if (!response.ok) {
          throw new Error('Failed to load annotations')
        }

        const data = await response.json()
        setAnnotations(data)
      } catch (error) {
        console.error('Error loading annotations:', error)
        setError('Failed to load annotations')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnnotations()
  }, [assetId])

  return {
    annotations: filteredAnnotations,
    allAnnotations: annotations,
    isLoading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addReply
  }
}