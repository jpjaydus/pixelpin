'use client'

import { useState, useEffect } from 'react'
import { Asset, Project } from '@prisma/client'
import { ImmersiveAnnotationView } from './ImmersiveAnnotationView'

interface GuestAnnotationViewProps {
  project: Project & {
    assets: Asset[]
    owner: {
      id: string
      name?: string | null
      email: string
    }
  }
  shareToken: string
}

export function GuestAnnotationView({
  project,
  shareToken
}: GuestAnnotationViewProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [guestInfo, setGuestInfo] = useState<{
    name: string
    email: string
  } | null>(null)
  const [showGuestForm, setShowGuestForm] = useState(true)

  // Check if guest info is stored in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`guest-info-${project.id}`)
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setGuestInfo(info)
        setShowGuestForm(false)
      } catch (error) {
        console.error('Failed to parse stored guest info:', error)
      }
    }
  }, [project.id])

  const handleGuestInfoSubmit = (info: { name: string; email: string }) => {
    setGuestInfo(info)
    setShowGuestForm(false)
    // Store guest info for this session
    localStorage.setItem(`guest-info-${project.id}`, JSON.stringify(info))
  }

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset)
  }

  if (showGuestForm) {
    return <GuestInfoForm onSubmit={handleGuestInfoSubmit} projectName={project.name} />
  }

  if (selectedAsset) {
    return (
      <ImmersiveAnnotationView
        asset={selectedAsset}
        project={{
          ...project,
          collaborators: [] // Guests don't see collaborators
        }}
        currentUser={{
          id: 'guest',
          name: guestInfo?.name,
          email: guestInfo?.email
        }}
        isGuest={true}
        guestToken={shareToken}
      />
    )
  }

  return (
    <GuestProjectView
      project={project}
      onAssetSelect={handleAssetSelect}
      guestInfo={guestInfo}
    />
  )
}

interface GuestInfoFormProps {
  onSubmit: (info: { name: string; email: string }) => void
  projectName: string
}

function GuestInfoForm({ onSubmit, projectName }: GuestInfoFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    onSubmit({
      name: name.trim(),
      email: email.trim()
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to {projectName}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please provide your information to continue as a guest
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue as Guest
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your information will only be used to identify your comments and is not stored permanently.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

interface GuestProjectViewProps {
  project: Project & {
    assets: Asset[]
    owner: {
      id: string
      name?: string | null
      email: string
    }
  }
  onAssetSelect: (asset: Asset) => void
  guestInfo: { name: string; email: string } | null
}

function GuestProjectView({ project, onAssetSelect, guestInfo }: GuestProjectViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">
                Shared by {project.owner.name || project.owner.email}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Viewing as:</span>
              <span className="text-sm font-medium text-blue-600">{guestInfo?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {project.description && (
          <div className="mb-8">
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onAssetSelect(asset)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {asset.type === 'IMAGE' ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === 'URL' ? (
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <p className="text-sm text-gray-600">Website</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">Document</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{asset.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{asset.type.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>

        {project.assets.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
            <p className="text-gray-500">This project doesn't have any assets to review.</p>
          </div>
        )}
      </div>
    </div>
  )
}