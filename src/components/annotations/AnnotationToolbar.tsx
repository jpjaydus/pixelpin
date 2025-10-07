'use client'

import { MousePointer, MessageCircle, Square, ArrowRight, Type } from 'lucide-react'

interface AnnotationToolbarProps {
  selectedTool: 'select' | 'comment' | 'rectangle' | 'arrow' | 'text'
  onToolSelect: (tool: 'select' | 'comment' | 'rectangle' | 'arrow' | 'text') => void
}

const tools = [
  {
    id: 'select' as const,
    name: 'Select',
    icon: MousePointer,
    description: 'Select and move annotations',
  },
  {
    id: 'comment' as const,
    name: 'Comment',
    icon: MessageCircle,
    description: 'Add comment pins',
  },
  {
    id: 'rectangle' as const,
    name: 'Rectangle',
    icon: Square,
    description: 'Draw rectangles',
  },
  {
    id: 'arrow' as const,
    name: 'Arrow',
    icon: ArrowRight,
    description: 'Draw arrows',
  },
  {
    id: 'text' as const,
    name: 'Text',
    icon: Type,
    description: 'Add text annotations',
  },
]

export default function AnnotationToolbar({
  selectedTool,
  onToolSelect,
}: AnnotationToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
      <div className="flex gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isSelected = selectedTool === tool.id
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-lg transition-colors
                ${isSelected
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              title={`${tool.name} - ${tool.description}`}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}