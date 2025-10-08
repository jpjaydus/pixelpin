'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { User } from '@prisma/client'

interface MentionTextareaProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  collaborators: User[]
  rows?: number
}

interface MentionSuggestion {
  id: string
  name: string
  email: string
  image?: string | null
}

export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  disabled = false,
  collaborators,
  rows = 3
}: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Extract mentions from text
  const extractMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]) // User ID
    }
    
    return mentions
  }, [])

  // Handle text change and mention detection
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      
      // Check if we're in a mention context (no spaces after @)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.toLowerCase()
        const filteredSuggestions = collaborators
          .filter(user => 
            user.name?.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
          )
          .map(user => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            image: user.image
          }))
          .slice(0, 5)
        
        setSuggestions(filteredSuggestions)
        setShowSuggestions(filteredSuggestions.length > 0)
        setSelectedSuggestion(0)
        setMentionStart(lastAtIndex)
      } else {
        setShowSuggestions(false)
        setMentionStart(null)
      }
    } else {
      setShowSuggestions(false)
      setMentionStart(null)
    }
    
    const mentions = extractMentions(newValue)
    onChange(newValue, mentions)
  }

  // Handle mention selection
  const insertMention = (user: MentionSuggestion) => {
    if (mentionStart === null || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeMention = value.slice(0, mentionStart)
    const textAfterCursor = value.slice(cursorPosition)
    
    const mentionText = `@[${user.name}](${user.id})`
    const newValue = textBeforeMention + mentionText + textAfterCursor
    const newCursorPosition = mentionStart + mentionText.length
    
    const mentions = extractMentions(newValue)
    onChange(newValue, mentions)
    
    setShowSuggestions(false)
    setMentionStart(null)
    
    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          insertMention(suggestions[selectedSuggestion])
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          setMentionStart(null)
          break
      }
    } else {
      onKeyDown?.(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  // Render text with highlighted mentions
  const renderTextWithMentions = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      
      // Add mention as highlighted text
      parts.push(
        <span key={match.index} className="bg-blue-100 text-blue-800 px-1 rounded">
          @{match[1]}
        </span>
      )
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none ${className}`}
        disabled={disabled}
        rows={rows}
      />
      
      {/* Mention Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => insertMention(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                index === selectedSuggestion ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              {suggestion.image ? (
                <img
                  src={suggestion.image}
                  alt={suggestion.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                  {suggestion.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.name}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}