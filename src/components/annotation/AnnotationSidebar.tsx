'use client'

import { useState, useMemo } from 'react'
import { User } from '@prisma/client'
import { AnnotationCard } from './AnnotationCard'

interface Annotation {
  id: string
  content: string
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
  screenshot: string
  pageUrl: string
  metadata: Record<string, unknown>
  position: { x: number; y: number }
  author?: User | null
  guestName?: string | null
  guestEmail?: string | null
  replies?: Array<{
    id: string
    content: string
    authorId: string
    createdAt: string
    author: User
  }>
}

interface AnnotationSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  annotations: Annotation[]
  selectedAnnotation?: string
  onAnnotationSelect: (id: string) => void
  onAnnotationUpdate: (id: string, data: { content?: string; status?: 'OPEN' | 'RESOLVED' }) => Promise<void>
  onAnnotationDelete: (id: string) => void
  onNavigateToAnnotation: (id: string) => void
  onAddReply: (annotationId: string, data: {
    content: string
    attachments?: {
      id: string
      filename: string
      url: string
      fileType: string
      fileSize: number
    }[]
  }) => Promise<void>
  onBulkUpdate?: (ids: string[], data: { status?: 'OPEN' | 'RESOLVED' }) => Promise<void>
  onBulkDelete?: (ids: string[]) => Promise<void>
  currentUser?: User
  projectCollaborators: User[]
  currentPageUrl: string
  isGuest?: boolean
  guestInfo?: {
    name?: string
    email?: string
  }
}

export function AnnotationSidebar({
  isCollapsed,
  onToggleCollapse,
  annotations,
  selectedAnnotation,
  onAnnotationSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
  onNavigateToAnnotation,
  onAddReply,
  onBulkUpdate,
  onBulkDelete,
  currentUser,
  projectCollaborators,
  currentPageUrl,
  isGuest = false,
  guestInfo
}: AnnotationSidebarProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByPage, setFilterByPage] = useState(false)
  const [selectedAnnotations, setSelectedAnnotations] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'author' | 'page'>('date')

  // Filter and sort annotations
  const filteredAnnotations = useMemo(() => {
    let filtered = annotations

    // Filter by tab
    filtered = filtered.filter(annotation => 
      activeTab === 'ACTIVE' ? annotation.status === 'OPEN' : annotation.status === 'RESOLVED'
    )

    // Filter by current page if enabled
    if (filterByPage) {
      filtered = filtered.filter(annotation => annotation.pageUrl === currentPageUrl)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(annotation =>
        annotation.content.toLowerCase().includes(query) ||
        (annotation.author?.name || annotation.guestName || '').toLowerCase().includes(query)
      )
    }

    // Sort annotations
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'author':
          const aAuthor = (a.author?.name || a.guestName || 'Anonymous').toLowerCase()
          const bAuthor = (b.author?.name || b.guestName || 'Anonymous').toLowerCase()
          return aAuthor.localeCompare(bAuthor)
        case 'page':
          return a.pageUrl.localeCompare(b.pageUrl)
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [annotations, activeTab, searchQuery, filterByPage, currentPageUrl])

  // Get annotation numbers for display
  const getAnnotationNumber = (annotation: Annotation) => {
    const pageAnnotations = annotations.filter(a => a.pageUrl === annotation.pageUrl && a.status === 'OPEN')
    return pageAnnotations.findIndex(a => a.id === annotation.id) + 1
  }

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedAnnotations.size === filteredAnnotations.length) {
      setSelectedAnnotations(new Set())
    } else {
      setSelectedAnnotations(new Set(filteredAnnotations.map(a => a.id)))
    }
  }

  const handleBulkResolve = async () => {
    if (onBulkUpdate && selectedAnnotations.size > 0) {
      const status = activeTab === 'ACTIVE' ? 'RESOLVED' : 'OPEN'
      await onBulkUpdate(Array.from(selectedAnnotations), { status })
      setSelectedAnnotations(new Set())
      // Switch to appropriate tab after bulk resolve
      if (status === 'RESOLVED') {
        setActiveTab('RESOLVED')
      } else {
        setActiveTab('ACTIVE')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedAnnotations.size > 0) {
      if (confirm(`Delete ${selectedAnnotations.size} annotation(s)? This action cannot be undone.`)) {
        await onBulkDelete(Array.from(selectedAnnotations))
        setSelectedAnnotations(new Set())
      }
    }
  }

  const toggleAnnotationSelection = (id: string) => {
    const newSelection = new Set(selectedAnnotations)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedAnnotations(newSelection)
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Collapsed annotation count */}
        <div className="mt-4 text-center">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mb-1">
            {annotations.filter(a => a.status === 'OPEN').length}
          </div>
          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
            {annotations.filter(a => a.status === 'RESOLVED').length}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col max-h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Annotations</h2>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search annotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filterByPage}
              onChange={(e) => setFilterByPage(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Current page only</span>
          </label>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'author' | 'page')}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="author">Sort by Author</option>
            <option value="page">Sort by Page</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`text-sm px-3 py-1 rounded transition-colors ${
              bulkMode
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </button>
          
          {bulkMode && selectedAnnotations.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">{selectedAnnotations.size} selected</span>
              <button
                onClick={handleBulkResolve}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                {activeTab === 'ACTIVE' ? 'Resolve' : 'Reopen'}
              </button>
              {onBulkDelete && (
                <button
                  onClick={handleBulkDelete}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {bulkMode && filteredAnnotations.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {selectedAnnotations.size === filteredAnnotations.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'ACTIVE'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({annotations.filter(a => a.status === 'OPEN').length})
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'RESOLVED'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Resolved ({annotations.filter(a => a.status === 'RESOLVED').length})
        </button>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAnnotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {searchQuery ? 'No matching annotations' : `No ${activeTab.toLowerCase()} annotations`}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : activeTab === 'ACTIVE' 
                  ? 'Switch to Comment Mode and click on the website to add annotations'
                  : 'Resolved annotations will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredAnnotations.map((annotation) => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                number={getAnnotationNumber(annotation)}
                isSelected={selectedAnnotation === annotation.id}
                onSelect={() => bulkMode ? toggleAnnotationSelection(annotation.id) : onAnnotationSelect(annotation.id)}
                onUpdate={(data) => onAnnotationUpdate(annotation.id, data)}
                onDelete={() => onAnnotationDelete(annotation.id)}
                onNavigateToPin={() => onNavigateToAnnotation(annotation.id)}
                onAddReply={(data) => onAddReply(annotation.id, data)}
                currentUser={currentUser}
                isGuest={isGuest}
                guestInfo={guestInfo}
                bulkMode={bulkMode}
                isBulkSelected={selectedAnnotations.has(annotation.id)}
                onBulkToggle={() => toggleAnnotationSelection(annotation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}