'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  HomeIcon, 
  FolderIcon, 
  CreditCardIcon, 
  CogIcon,
  ArrowLeftIcon,
  UserIcon,
  LogOutIcon
} from 'lucide-react'

interface FocusModeLayoutProps {
  children: ReactNode
  projectId: string
  assetId: string
  showSidebar: boolean
  onToggleSidebar: () => void
}

export function FocusModeLayout({
  children,
  projectId,
  assetId,
  showSidebar,
  onToggleSidebar
}: FocusModeLayoutProps) {
  const [showDashboardSidebar, setShowDashboardSidebar] = useState(false)
  const router = useRouter()

  const handleBackToProject = () => {
    router.push(`/projects/${projectId}`)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      {/* Hamburger Menu Overlay */}
      {showDashboardSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowDashboardSidebar(false)}
        />
      )}

      {/* Dashboard Sidebar (Hidden by default in focus mode) */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${showDashboardSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              PixelPin
            </Link>
            <button
              onClick={() => setShowDashboardSidebar(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            
            <Link
              href="/projects"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <FolderIcon className="w-5 h-5 mr-3" />
              Projects
            </Link>
            
            <Link
              href="/pricing"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <CreditCardIcon className="w-5 h-5 mr-3" />
              Pricing
            </Link>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={handleBackToProject}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-3" />
                Back to Project
              </button>
            </div>
          </nav>

          {/* User Menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  User Account
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOutIcon className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hamburger Menu Button (Always visible in top-left) */}
        <div className="absolute top-4 left-4 z-40">
          <button
            onClick={() => setShowDashboardSidebar(true)}
            className="p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            title="Open navigation menu"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}