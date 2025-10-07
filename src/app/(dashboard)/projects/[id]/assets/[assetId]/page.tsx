'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AnnotationCanvas from '@/components/annotations/AnnotationCanvas'
import AnnotationToolbar from '@/components/annotations/AnnotationToolbar'
import AnnotationPanel from '@/components/annotations/AnnotationPanel'

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
          
          <AnnotationToolbar
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-6">
          <AnnotationCanvas
            assetUrl={asset.url}
            assetType={asset.type}
            annotations={annotations}
            selectedTool={selectedTool}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationSelect={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
          />
        </div>

        {/* Annotation Panel */}
        <AnnotationPanel
          annotations={annotations}
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