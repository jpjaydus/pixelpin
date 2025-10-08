'use client'

import { useState, useRef, useCallback } from 'react'
import { Asset, Project, User } from '@prisma/client'
import { FocusModeLayout } from './FocusModeLayout'
import { AnnotationModeToggle } from './AnnotationModeToggle'
import { ViewportControls } from './ViewportControls'
import { WebsiteIframe } from './WebsiteIframe'
import { AnnotationOverlay } from './AnnotationOverlay'
import { AnnotationSidebar } from './AnnotationSidebar'
import { useAnnotations } from '@/hooks/useAnnotations'
import { captureScreenshot } from '@/lib/screenshot'
import { collectBrowserMetadata } from '@/lib/browser-metadata'
import { saveUrlState, loadUrlState, hasNavigatedFromBase, getPathFromUrl } from '@/lib/url-state'

export type ViewportType = 'DESKTOP' | 'TABLET' | 'MOBILE'
export type AnnotationMode = 'COMMENT' | 'BROWSE'

interface ProjectWithCollaborators extends Project {
  owner: User
  collaborators: Array<{
    user: User
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
}

export function ImmersiveAnnotationView({
  asset,
  project,
  currentUser
}: ImmersiveAnnotationViewProps) {
  // Load saved state or use defaults
  const savedState = loadUrlState(asset.id)
  
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentMode, setCurrentMode] = useState<AnnotationMode>(savedState?.mode || 'COMMENT')
  const [currentViewport, setCurrentViewport] = useState<ViewportType>(savedState?.viewport || 'DESKTOP')
  const [currentUrl, setCurrentUrl] = useState(savedState?.currentUrl || asset.url)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string>()
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useAnnotations(asset.id, currentUrl)

  const handleCreateAnnotation = useCallback(async (position: { x: number; y: number }) => {
    if (!iframeRef.current) return

    try {
      // Capture screenshot and metadata
      const screenshotResult = await captureScreenshot(iframeRef.current, currentUrl)
      const metadata = collectBrowserMetadata()

      // Create annotation with professional context
      await createAnnotation({
        position,
        content: '', // Will be filled in by the annotation form
        screenshot: screenshotResult.url,
        pageUrl: currentUrl,
        metadata
      })
    } catch (error) {
      console.error('Failed to create annotation:', error)
      // Could show error toast here
    }
  }, [currentUrl, createAnnotation])

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
    // Save state when URL changes
    saveUrlState(asset.id, {
      currentUrl: newUrl,
      mode: currentMode,
      viewport: currentViewport
    })
  }, [asset.id, currentMode, currentViewport])

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(!showSidebar)
  }, [showSidebar])

  const handleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed])

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
          {hasNavigatedFromBase(asset.url, currentUrl) && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Navigated to: {getPathFromUrl(currentUrl)}
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
          />
        </div>

        {/* Annotation Sidebar */}
        {showSidebar && (
          <AnnotationSidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarCollapse}
            annotations={annotations}
            selectedAnnotation={selectedAnnotation}
            onAnnotationSelect={setSelectedAnnotation}
            onAnnotationResolve={(id: string) => updateAnnotation(id, { status: 'RESOLVED' })}
            onAnnotationDelete={deleteAnnotation}
            currentUser={currentUser}
            projectCollaborators={project.collaborators.map(c => c.user)}
          />
        )}
      </div>
    </FocusModeLayout>
  )
}