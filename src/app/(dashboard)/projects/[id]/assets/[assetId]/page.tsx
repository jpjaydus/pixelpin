'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AnnotationToolbar from '@/components/annotations/AnnotationToolbar'
import { LazyAnnotationCanvas, LazyAnnotationPanel, LazyUserPresence } from '@/components/LazyComponents'
import { useRealtime } from '@/hooks/useRealtime'

interface Asset {
  id: string
  name: string
  type: 'IMAGE' | 'PDF' | 'URL'
  url: string
  project: {
    id: string
    name: string
  }
}

interface Annotation {
  id: string
  content: string
  type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
  status: 'OPEN' | 'RESOLVED'
  position: {
    x: number
    y: number
    width?: number
    height?: number
  }
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  replies: Reply[]
}

interface Reply {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function AssetViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  const projectId = params.id as string
  const assetId = params.assetId as string
  
  const [selectedTool, setSelectedTool] = useState<'select' | 'comment' | 'rectangle' | 'arrow' | 'text'>('select')
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Array<{
    id: string
    user_info: {
      id: string
      name: string
      email: string
      image?: string
    }
  }>>([])
  const [realtimeAnnotations, setRealtimeAnnotations] = useState<Annotation[]>([])

  // Fetch asset details
  const { data: asset, isLoading: assetLoading, error: assetError } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/assets/${assetId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch asset')
      }
      return response.json() as Promise<Asset>
    },
  })

  // Fetch annotations
  const { data: annotations = [], isLoading: annotationsLoading } = useQuery({
    queryKey: ['annotations', assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/annotations`)
      if (!response.ok) {
        throw new Error('Failed to fetch annotations')
      }
      return response.json() as Promise<Annotation[]>
    },
  })

  // Create annotation mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (annotationData: {
      position: { x: number; y: number; width?: number; height?: number }
      content: string
      type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
    }) => {
      const response = await fetch(`/api/assets/${assetId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annotationData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create annotation')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', assetId] })
      setSelectedTool('select')
    },
  })

  // Update annotation mutation
  const updateAnnotationMutation = useMutation({
    mutationFn: async ({ annotationId, updates }: {
      annotationId: string
      updates: { status?: 'OPEN' | 'RESOLVED'; content?: string }
    }) => {
      const response = await fetch(`/api/annotations/${annotationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update annotation')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', assetId] })
    },
  })

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      const response = await fetch(`/api/annotations/${annotationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete annotation')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', assetId] })
      setSelectedAnnotationId(null)
    },
  })

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ annotationId, content }: {
      annotationId: string
      content: string
    }) => {
      const response = await fetch(`/api/annotations/${annotationId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create reply')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', assetId] })
    },
  })

  // Initialize realtime annotations with fetched data
  React.useEffect(() => {
    if (annotations) {
      setRealtimeAnnotations(annotations)
    }
  }, [annotations])

  const handleAnnotationCreate = (annotationData: {
    position: { x: number; y: number; width?: number; height?: number }
    content: string
    type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
  }) => {
    createAnnotationMutation.mutate(annotationData)
  }

  const handleAnnotationUpdate = (annotationId: string, updates: { status?: 'OPEN' | 'RESOLVED'; content?: string }) => {
    updateAnnotationMutation.mutate({ annotationId, updates })
  }

  const handleAnnotationDelete = (annotationId: string) => {
    if (confirm('Are you sure you want to delete this annotation?')) {
      deleteAnnotationMutation.mutate(annotationId)
    }
  }

  const handleReplyCreate = (annotationId: string, content: string) => {
    createReplyMutation.mutate({ annotationId, content })
  }

  // Real-time collaboration
  const { getPresenceMembers } = useRealtime({
    assetId,
    onAnnotationCreated: (annotation) => {
      setRealtimeAnnotations(prev => [annotation, ...prev])
    },
    onAnnotationUpdated: (annotation) => {
      setRealtimeAnnotations(prev => 
        prev.map(a => a.id === annotation.id ? annotation : a)
      )
    },
    onAnnotationDeleted: ({ id }) => {
      setRealtimeAnnotations(prev => prev.filter(a => a.id !== id))
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null)
      }
    },
    onReplyCreated: (reply) => {
      setRealtimeAnnotations(prev =>
        prev.map(a => 
          a.id === reply.annotationId 
            ? { ...a, replies: [...a.replies, reply] }
            : a
        )
      )
    },
    onUserJoined: (user) => {
      setOnlineUsers(prev => [...prev, user])
    },
    onUserLeft: (user) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user.id))
    },
  })

  // Update online users from presence
  React.useEffect(() => {
    const members = getPresenceMembers()
    setOnlineUsers(members)
  }, [getPresenceMembers])

  // Redirect URL assets to immersive annotation interface
  useEffect(() => {
    if (asset && asset.type === 'URL') {
      router.replace(`/projects/${projectId}/assets/${assetId}/immersive`)
    }
  }, [asset, projectId, assetId, router])

  if (assetLoading || annotationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (assetError || !asset) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset not found</h2>
          <p className="text-gray-600 mb-4">The asset you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{asset.name}</h1>
              <p className="text-sm text-gray-600">{asset.project.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <AnnotationToolbar
              selectedTool={selectedTool}
              onToolSelect={setSelectedTool}
            />
            
            {/* Immersive Mode Button for URL assets */}
            {asset.type === 'URL' && (
              <button
                onClick={() => router.push(`/projects/${projectId}/assets/${assetId}/immersive`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                Immersive Mode
              </button>
            )}
            
            <LazyUserPresence
              users={onlineUsers}
              currentUserId={session?.user?.id || ''}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-6">
          <LazyAnnotationCanvas
            assetUrl={asset.url}
            assetType={asset.type}
            annotations={realtimeAnnotations}
            selectedTool={selectedTool}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationSelect={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
          />
        </div>

        {/* Annotation Panel */}
        <LazyAnnotationPanel
          annotations={realtimeAnnotations}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationSelect={setSelectedAnnotationId}
          onAnnotationUpdate={handleAnnotationUpdate}
          onAnnotationDelete={handleAnnotationDelete}
          onReplyCreate={handleReplyCreate}
          currentUserId={session?.user?.id || ''}
        />
      </div>
    </div>
  )
}