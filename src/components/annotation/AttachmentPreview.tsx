'use client'

import { useState, useEffect } from 'react'
import { Attachment } from '@/types/attachment'

interface AttachmentPreviewProps {
  attachment: Attachment & {
    mimeType: string
    size: number
  }
  onClose: () => void
}

export function AttachmentPreview({ attachment, onClose }: AttachmentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  const isImage = attachment.mimeType.startsWith('image/')
  const isPdf = attachment.mimeType === 'application/pdf'
  const isText = attachment.mimeType.startsWith('text/')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center max-w-full max-h-full">
          <img
            src={attachment.url}
            alt={attachment.filename}
            className="max-w-full max-h-full object-contain rounded"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setError('Failed to load image')
            }}
          />
        </div>
      )
    }

    if (isPdf) {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${attachment.url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0 rounded"
            title={attachment.filename}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setError('Failed to load PDF')
            }}
          />
        </div>
      )
    }

    if (isText && attachment.size < 1024 * 1024) { // Only preview text files under 1MB
      return (
        <div className="w-full h-full bg-gray-50 rounded p-4 overflow-auto">
          <TextFilePreview 
            url={attachment.url} 
            onLoad={() => setIsLoading(false)}
            onError={(err) => {
              setIsLoading(false)
              setError(err)
            }}
          />
        </div>
      )
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg font-medium mb-2">{attachment.filename}</p>
        <p className="text-sm text-gray-400 mb-4">
          {attachment.mimeType} • {formatFileSize(attachment.size)}
        </p>
        <p className="text-sm mb-4">Preview not available for this file type</p>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download File
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl max-h-full w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {attachment.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {attachment.mimeType} • {formatFileSize(attachment.size)}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">⚠️</div>
                <p>{error}</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
          
          {!error && (
            <div className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TextFilePreview({ 
  url, 
  onLoad, 
  onError 
}: { 
  url: string
  onLoad: () => void
  onError: (error: string) => void
}) {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch file')
        return response.text()
      })
      .then(text => {
        setContent(text)
        onLoad()
      })
      .catch(err => {
        onError(err.message)
      })
  }, [url, onLoad, onError])

  return (
    <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
      {content}
    </pre>
  )
}