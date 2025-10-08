// Performance optimization utilities

// Lazy loading utility for images and attachments
export function createLazyLoader() {
  if (typeof window === 'undefined') return null

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  )

  return observer
}

// Debounce utility for search and filtering
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Memory management for iframe
export function cleanupIframe(iframe: HTMLIFrameElement) {
  try {
    // Clear iframe content
    if (iframe.contentWindow) {
      iframe.contentWindow.location.replace('about:blank')
    }
    
    // Remove event listeners
    iframe.onload = null
    iframe.onerror = null
    
    // Clear src
    iframe.src = 'about:blank'
    
    // Force garbage collection hint
    if (window.gc) {
      window.gc()
    }
  } catch (error) {
    console.warn('Error cleaning up iframe:', error)
  }
}

// Efficient annotation filtering with pagination
export interface AnnotationFilter {
  pageUrl?: string
  status?: 'OPEN' | 'RESOLVED'
  authorId?: string
  search?: string
  limit?: number
  offset?: number
}

export function filterAnnotations(
  annotations: Array<{
    id: string
    pageUrl: string
    status: string
    authorId?: string
    content: string
    guestName?: string
  }>,
  filter: AnnotationFilter
): { filtered: typeof annotations; total: number } {
  let filtered = [...annotations]

  // Apply filters
  if (filter.pageUrl) {
    filtered = filtered.filter(a => a.pageUrl === filter.pageUrl)
  }

  if (filter.status) {
    filtered = filtered.filter(a => a.status === filter.status)
  }

  if (filter.authorId) {
    filtered = filtered.filter(a => a.authorId === filter.authorId)
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(a => 
      a.content.toLowerCase().includes(searchLower) ||
      (a.author?.name || a.guestName || '').toLowerCase().includes(searchLower)
    )
  }

  const total = filtered.length

  // Apply pagination
  if (filter.limit) {
    const offset = filter.offset || 0
    filtered = filtered.slice(offset, offset + filter.limit)
  }

  return { filtered, total }
}

// Cache management for frequently accessed data
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Create cache instances
export const annotationCache = new SimpleCache<unknown[]>(5) // 5 minutes
export const projectCache = new SimpleCache<unknown>(10) // 10 minutes
export const userCache = new SimpleCache<unknown>(15) // 15 minutes

// Real-time connection management
export class ConnectionManager {
  private connections = new Map<string, { disconnect?: () => void }>()
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  addConnection(id: string, connection: { disconnect?: () => void }): void {
    this.connections.set(id, connection)
    this.reconnectAttempts.set(id, 0)
  }

  removeConnection(id: string): void {
    const connection = this.connections.get(id)
    if (connection && connection.disconnect) {
      connection.disconnect()
    }
    this.connections.delete(id)
    this.reconnectAttempts.delete(id)
  }

  async reconnect(id: string, createConnection: () => Promise<{ disconnect?: () => void }>): Promise<boolean> {
    const attempts = this.reconnectAttempts.get(id) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${id}`)
      return false
    }

    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * Math.pow(2, attempts)))
      
      const connection = await createConnection()
      this.addConnection(id, connection)
      
      console.log(`Reconnected ${id} after ${attempts + 1} attempts`)
      return true
    } catch (error) {
      this.reconnectAttempts.set(id, attempts + 1)
      console.error(`Reconnection attempt ${attempts + 1} failed for ${id}:`, error)
      return false
    }
  }

  getConnection(id: string): { disconnect?: () => void } | undefined {
    return this.connections.get(id)
  }

  cleanup(): void {
    for (const [id] of this.connections) {
      this.removeConnection(id)
    }
  }
}

export const connectionManager = new ConnectionManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    connectionManager.cleanup()
    annotationCache.clear()
    projectCache.clear()
    userCache.clear()
  })
}