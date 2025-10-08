'use client'

import { useState, useRef, useCallback } from 'react'
import { Asset, Project } from '@prisma/client'
import { FocusModeLayout } from './FocusModeLayout'
import { AnnotationModeToggle } from './AnnotationModeToggle'
import { ViewportControls } from './ViewportControls'
import { WebsiteIframe } from './WebsiteIframe'
import { AnnotationOverlay } from './AnnotationOverlay'
import { AnnotationSidebar } from './AnnotationSidebar'
import { CollaboratorPresence } from './CollaboratorPresence'
import { useAnnotations } from '@/hooks/useAnnotations'
import { useRealtime } from '@/hooks/useRealtime'
import { captureScreenshot } from '@/lib/screenshot'
import { collectBrowserMetadata } from '@/lib/browser-metadata'
import { saveUrlState, loadUrlState } from '@/lib/url-state'
import { useUrlContext } from '@/hooks/useUrlContext'

export type ViewportType = 'DESKTOP' | 'TABLET' | 'MOBILE'
export type AnnotationMode = 'COMMENT' | 'BROWSE'

interface ProjectWithCollaborators extends Project {
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  collaborators: Array<{
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
    role: string
  }>
}

interface ImmersiveAnnotationViewProps {
  asset: Asset
  project: ProjectWithCollaborators
  currentUser: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  isGuest?: boolean
  guestToken?: string
}

export function ImmersiveAnnotationView({
  asset,
  project,
  currentUser,
  isGuest = false,
  guestToken
}: ImmersiveAnnotationViewProps) {
  // Load saved state or use defaults
  const savedState = loadUrlState(asset.id)
  
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentMode, setCurrentMode] = useState<AnnotationMode>(savedState?.mode || 'COMMENT')
  const [currentViewport, setCurrentViewport] = useState<ViewportType>(savedState?.viewport || 'DESKTOP')
  
  // Real-time collaboration state
  const [collaboratorCursors, setCollaboratorCursors] = useState<Map<string, {
    userId: string
    userName: string
    x: number
    y: number
    timestamp: number
  }>>(new Map())
  const [onlineCollaborators, setOnlineCollaborators] = useState<Array<{
    id: string
    user_info: {
      id: string
      name: string
      email: string
      image?: string
    }
  }>>([])
  const [showPresence, setShowPresence] = useState(true)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string>()
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // URL context management
  const {
    currentUrl,
    currentContext,
    history: urlHistory,
    isAtBaseUrl,
    canAccessContent,
    isValidUrl,
    error: urlError,
    setCurrentUrl,
    getBreadcrumb
  } = useUrlContext({
    baseUrl: savedState?.currentUrl || asset.url,
    onUrlChange: (url, context) => {
      // Save state when URL changes
      saveUrlState(asset.id, {
        currentUrl: url,
        mode: currentMode,
        viewport: currentViewport
      })
    },
    trackingEnabled: currentMode === 'BROWSE'
  })
  
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addReply
  } = useAnnotations(asset.id, currentUrl)

  // Real-time collaboration
  const { broadcastCursorMove, getPresenceMembers } = useRealtime({
    assetId: asset.id,
    onAnnotationCreated: (annotation) => {
      // Annotation will be automatically added by useAnnotations
      // Show notification for new annotations from other users
      if (annotation.author.id !== currentUser.id) {
        // You could add a toast notification here
        console.log('New annotation from', annotation.author.name)
      }
    },
    onAnnotationUpdated: (annotation) => {
      // Annotation will be automatically updated by useAnnotations
      if (annotation.author.id !== currentUser.id) {
        console.log('Annotation updated by', annotation.author.name)
      }
    },
    onAnnotationDeleted: (data) => {
      // Annotation will be automatically removed by useAnnotations
      console.log('Annotation deleted:', data.id)
    },
    onCursorMoved: (cursor) => {
      if (cursor.userId !== currentUser.id) {
        setCollaboratorCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(cursor.userId, {
            ...cursor,
            timestamp: Date.now()
          })
          return newCursors
        })
      }
    },
    onUserJoined: (user) => {
      setOnlineCollaborators(prev => [...prev, user])
    },
    onUserLeft: (user) => {
      setOnlineCollaborators(prev => prev.filter(u => u.id !== user.id))
      setCollaboratorCursors(prev => {
        const newCursors = new Map(prev)
        newCursors.delete(user.id)
        return newCursors
      })
    }
  })

  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false)
  const [annotationError, setAnnotationError] = useState<string>()

  const handleCreateAnnotation = useCallback(async (position: { x: number; y: number }) => {
    if (!iframeRef.current || isCreatingAnnotation) return

    setIsCreatingAnnotation(true)
    setAnnotationError(undefined)

    try {
      // Capture screenshot and metadata
      const screenshotResult = await captureScreenshot(iframeRef.current, currentUrl)
      const metadata = collectBrowserMetadata()

      // Create annotation with professional context
      const newAnnotation = await createAnnotation({
        position,
        content: '', // Will be filled in by the annotation form
        screenshot: screenshotResult.url,
        pageUrl: currentUrl,
        metadata: metadata as unknown as Record<string, unknown>
      })

      // Auto-select the newly created annotation
      if (newAnnotation?.id) {
        setSelectedAnnotation(newAnnotation.id)
      }

    } catch (error) {
      console.error('Failed to create annotation:', error)
      setAnnotationError(error instanceof Error ? error.message : 'Failed to create annotation')
    } finally {
      setIsCreatingAnnotation(false)
    }
  }, [currentUrl, createAnnotation, isCreatingAnnotation])

  const handleModeChange = useCallback((mode: AnnotationMode) => {
    setCurrentMode(mode)
    // Save state when mode changes
    saveUrlState(asset.id, {
      currentUrl,
      mode,
      viewport: currentViewport
    })
  }, [asset.id, currentUrl, currentViewport])

  const handleViewportChange = useCallback((viewport: ViewportType) => {
    setCurrentViewport(viewport)
    // Save state when viewport changes
    saveUrlState(asset.id, {
      currentUrl,
      mode: currentMode,
      viewport
    })
  }, [asset.id, currentUrl, currentMode])

  const handleUrlChange = useCallback((newUrl: string) => {
    setCurrentUrl(newUrl)
  }, [setCurrentUrl])

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(!showSidebar)
  }, [showSidebar])

  const handleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed])

  const handleBulkUpdate = useCallback(async (ids: string[], data: { status?: 'OPEN' | 'RESOLVED' }) => {
    try {
      // Update annotations in parallel
      await Promise.all(ids.map(id => updateAnnotation(id, data)))
    } catch (error) {
      console.error('Failed to bulk update annotations:', error)
    }
  }, [updateAnnotation])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      // Delete annotations in parallel
      await Promise.all(ids.map(id => deleteAnnotation(id)))
    } catch (error) {
      console.error('Failed to bulk delete annotations:', error)
    }
  }, [deleteAnnotation])

  return (
    <FocusModeLayout
      projectId={project.id}
      assetId={asset.id}
      showSidebar={showSidebar}
      onToggleSidebar={handleToggleSidebar}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {asset.name}
          </h1>
          <span className="text-sm text-gray-500">
            {project.name}
          </span>
          {/* Current URL indicator */}
          {!isAtBaseUrl && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Navigated to: {currentContext.path}
              </span>
              {!canAccessContent && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full" title="Limited URL tracking due to cross-origin restrictions">
                  ⚠️ Limited tracking
                </span>
              )}
            </div>
          )}
          
          {/* URL Error indicator */}
          {urlError && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              ⚠️ {urlError}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <AnnotationModeToggle
            currentMode={currentMode}
            onModeChange={handleModeChange}
          />
          
          <ViewportControls
            currentViewport={currentViewport}
            onViewportChange={handleViewportChange}
          />

          {/* Annotation count indicator */}
          <div className="text-sm text-gray-600">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </div>

          <button
            onClick={handleToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Website Iframe Container */}
        <div className={`
          flex-1 relative mode-transition
          ${currentMode === 'COMMENT' ? 'annotation-mode-active' : 'browse-mode-active'}
        `}>
          <WebsiteIframe
            ref={iframeRef}
            url={asset.url}
            viewport={currentViewport}
            mode={currentMode}
            onLoad={() => {}}
            onUrlChange={handleUrlChange}
          />
          
          {/* Annotation Overlay */}
          <AnnotationOverlay
            isActive={currentMode === 'COMMENT'}
            onAnnotationCreate={handleCreateAnnotation}
            onAnnotationSelect={setSelectedAnnotation}
            annotations={annotations}
            selectedAnnotation={selectedAnnotation}
            currentPageUrl={currentUrl}
            viewport={currentViewport}
            iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
            onCursorMove={broadcastCursorMove}
          />
        </div>

        {/* Annotation Sidebar */}
        {showSidebar && (
          <AnnotationSidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarCollapse}
            annotations={annotations.map(ann => ({
              ...ann,
              author: ann.author ? {
                ...ann.author,
                name: ann.author.name || null,
                image: ann.author.image || null,
                password: null,
                emailVerified: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                stripePriceId: null,
                stripeCurrentPeriodEnd: null
              } : null,
              replies: (ann.replies || []).map((reply: { id: string; content: string; authorId: string; createdAt: string; author: { id: string; name: string; email: string } }) => ({
                ...reply,
                author: reply.author ? {
                  ...reply.author,
                  name: reply.author.name || null,
                  image: reply.author.image || null,
                  password: null,
                  emailVerified: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  stripeCustomerId: null,
                  stripeSubscriptionId: null,
                  stripePriceId: null,
                  stripeCurrentPeriodEnd: null
                } : null
              }))
            }))}
            selectedAnnotation={selectedAnnotation}
            onAnnotationSelect={setSelectedAnnotation}
            onAnnotationUpdate={updateAnnotation}
            onAnnotationDelete={deleteAnnotation}
            onAddReply={addReply}
            onBulkUpdate={handleBulkUpdate}
            onBulkDelete={handleBulkDelete}
            onNavigateToAnnotation={(id) => {
              setSelectedAnnotation(id)
              // Scroll to annotation pin
              const annotation = annotations.find(a => a.id === id)
              if (annotation && iframeRef.current) {
                // Smooth scroll to annotation position
                const pin = document.querySelector(`[data-annotation-id="${id}"]`)
                if (pin) {
                  pin.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }
            }}
            currentUser={currentUser}
            projectCollaborators={project.collaborators?.map(c => c.user) || []}
            currentPageUrl={currentUrl}
          />
        )}
      </div>

      {/* Collaborator Presence */}
      {!isGuest && (
        <CollaboratorPresence
          cursors={collaboratorCursors}
          onlineCollaborators={onlineCollaborators}
          currentUserId={currentUser.id}
          isVisible={showPresence}
          onToggleVisibility={() => setShowPresence(!showPresence)}
        />
      )}
    </FocusModeLayout>
  )
}