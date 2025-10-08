'use client'

import { ViewportType } from './ImmersiveAnnotationView'
import { MonitorIcon, TabletIcon, SmartphoneIcon } from 'lucide-react'

interface ViewportControlsProps {
  currentViewport: ViewportType
  onViewportChange: (viewport: ViewportType) => void
}

const viewportConfig = {
  DESKTOP: {
    icon: MonitorIcon,
    label: 'Desktop',
    width: '100%',
    description: 'Full width',
    dimensions: 'Responsive'
  },
  TABLET: {
    icon: TabletIcon,
    label: 'Tablet',
    width: '768px',
    description: '768px width',
    dimensions: '768×1024'
  },
  MOBILE: {
    icon: SmartphoneIcon,
    label: 'Mobile',
    width: '390px',
    description: '390px width',
    dimensions: '390×844'
  }
}

export function ViewportControls({
  currentViewport,
  onViewportChange
}: ViewportControlsProps) {
  const currentConfig = viewportConfig[currentViewport]

  return (
    <div className="flex items-center space-x-3">
      {/* Viewport Toggle Buttons */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {(Object.keys(viewportConfig) as ViewportType[]).map((viewport) => {
          const config = viewportConfig[viewport]
          const Icon = config.icon
          const isActive = currentViewport === viewport

          return (
            <button
              key={viewport}
              onClick={() => onViewportChange(viewport)}
              className={`
                p-2 rounded-md transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }
              `}
              title={`${config.label} (${config.dimensions})`}
            >
              <Icon className="w-4 h-4" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {config.label} ({config.dimensions})
              </div>
            </button>
          )
        })}
      </div>

      {/* Current Viewport Indicator */}
      <div className="text-sm text-gray-600 font-medium">
        {currentConfig.dimensions}
      </div>
    </div>
  )
}