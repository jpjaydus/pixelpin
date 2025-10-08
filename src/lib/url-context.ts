/**
 * URL Context Management System
 * Handles URL tracking, validation, and context management for annotations
 */

export interface UrlContext {
  url: string
  domain: string
  path: string
  title?: string
  timestamp: string
}

export interface UrlHistory {
  baseUrl: string
  visitedUrls: UrlContext[]
  currentUrl: string
}

/**
 * Validate if URL is accessible for iframe embedding
 */
export async function validateUrlAccessibility(url: string): Promise<{
  isValid: boolean
  canEmbed: boolean
  error?: string
}> {
  try {
    const urlObj = new URL(url)
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        canEmbed: false,
        error: 'Only HTTP and HTTPS URLs are supported'
      }
    }

    // Check for localhost/private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase()
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        return {
          isValid: false,
          canEmbed: false,
          error: 'Private/local URLs are not accessible in production'
        }
      }
    }

    return {
      isValid: true,
      canEmbed: true
    }
  } catch {
    return {
      isValid: false,
      canEmbed: false,
      error: 'Invalid URL format'
    }
  }
}

/**
 * Extract URL context information
 */
export function extractUrlContext(url: string, title?: string): UrlContext {
  try {
    const urlObj = new URL(url)
    return {
      url,
      domain: urlObj.hostname,
      path: urlObj.pathname + urlObj.search + urlObj.hash,
      title,
      timestamp: new Date().toISOString()
    }
  } catch {
    return {
      url,
      domain: 'unknown',
      path: url,
      title,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Check if two URLs are on the same page (ignoring hash)
 */
export function isSamePage(url1: string, url2: string): boolean {
  try {
    const urlObj1 = new URL(url1)
    const urlObj2 = new URL(url2)
    
    return urlObj1.origin === urlObj2.origin &&
           urlObj1.pathname === urlObj2.pathname &&
           urlObj1.search === urlObj2.search
  } catch {
    return url1 === url2
  }
}

/**
 * Check if URL has navigated from base URL
 */
export function hasNavigatedFromBase(baseUrl: string, currentUrl: string): boolean {
  return !isSamePage(baseUrl, currentUrl)
}

/**
 * Get relative path from URL for display
 */
export function getDisplayPath(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search + urlObj.hash
    return path === '/' ? '/' : path
  } catch {
    return url
  }
}

/**
 * Get domain from URL for display
 */
export function getDisplayDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

/**
 * URL History Management
 */
export class UrlHistoryManager {
  private history: UrlHistory
  private maxHistorySize = 50

  constructor(baseUrl: string) {
    this.history = {
      baseUrl,
      visitedUrls: [extractUrlContext(baseUrl)],
      currentUrl: baseUrl
    }
  }

  /**
   * Add a new URL to the history
   */
  addUrl(url: string, title?: string): void {
    const context = extractUrlContext(url, title)
    
    // Don't add duplicate consecutive URLs
    const lastUrl = this.history.visitedUrls[this.history.visitedUrls.length - 1]
    if (lastUrl && isSamePage(lastUrl.url, url)) {
      return
    }

    this.history.visitedUrls.push(context)
    this.history.currentUrl = url

    // Limit history size
    if (this.history.visitedUrls.length > this.maxHistorySize) {
      this.history.visitedUrls = this.history.visitedUrls.slice(-this.maxHistorySize)
    }
  }

  /**
   * Get current URL context
   */
  getCurrentContext(): UrlContext {
    return this.history.visitedUrls[this.history.visitedUrls.length - 1] || 
           extractUrlContext(this.history.currentUrl)
  }

  /**
   * Get all visited URLs
   */
  getHistory(): UrlContext[] {
    return [...this.history.visitedUrls]
  }

  /**
   * Check if current URL is the base URL
   */
  isAtBaseUrl(): boolean {
    return isSamePage(this.history.baseUrl, this.history.currentUrl)
  }

  /**
   * Get navigation breadcrumb
   */
  getBreadcrumb(): string[] {
    const uniqueDomains = new Set<string>()
    const breadcrumb: string[] = []

    this.history.visitedUrls.forEach(context => {
      if (!uniqueDomains.has(context.domain)) {
        uniqueDomains.add(context.domain)
        breadcrumb.push(context.domain)
      }
    })

    return breadcrumb
  }

  /**
   * Export history for persistence
   */
  export(): UrlHistory {
    return { ...this.history }
  }

  /**
   * Import history from persistence
   */
  import(history: UrlHistory): void {
    this.history = { ...history }
  }
}

/**
 * URL Pattern Matching for annotation filtering
 */
export class UrlMatcher {
  /**
   * Check if URL matches a pattern
   */
  static matches(url: string, pattern: string): boolean {
    try {
      new URL(url) // Validate URL format
      new URL(pattern) // Validate pattern format

      // Exact match
      if (url === pattern) return true

      // Same page match (ignoring hash)
      if (isSamePage(url, pattern)) return true

      // Domain match with wildcard path
      if (pattern.endsWith('/*')) {
        const baseDomain = pattern.slice(0, -2)
        return url.startsWith(baseDomain)
      }

      return false
    } catch {
      return url === pattern
    }
  }

  /**
   * Get all URLs that match a pattern
   */
  static filterByPattern(urls: string[], pattern: string): string[] {
    return urls.filter(url => this.matches(url, pattern))
  }

  /**
   * Group URLs by domain
   */
  static groupByDomain(urls: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {}

    urls.forEach(url => {
      const domain = getDisplayDomain(url)
      if (!groups[domain]) {
        groups[domain] = []
      }
      groups[domain].push(url)
    })

    return groups
  }
}