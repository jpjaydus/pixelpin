/**
 * Utility functions for managing URL state and mode persistence
 */

export interface UrlState {
  currentUrl: string
  mode: 'COMMENT' | 'BROWSE'
  viewport: 'DESKTOP' | 'TABLET' | 'MOBILE'
}

/**
 * Save URL state to localStorage
 */
export function saveUrlState(assetId: string, state: UrlState): void {
  try {
    const key = `pixelpin_url_state_${assetId}`
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save URL state:', error)
  }
}

/**
 * Load URL state from localStorage
 */
export function loadUrlState(assetId: string): Partial<UrlState> | null {
  try {
    const key = `pixelpin_url_state_${assetId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load URL state:', error)
  }
  return null
}

/**
 * Clear URL state from localStorage
 */
export function clearUrlState(assetId: string): void {
  try {
    const key = `pixelpin_url_state_${assetId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear URL state:', error)
  }
}

/**
 * Extract domain from URL for display
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (error) {
    return url
  }
}

/**
 * Extract path from URL for display
 */
export function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch (error) {
    return url
  }
}

/**
 * Check if URL is different from base URL
 */
export function hasNavigatedFromBase(baseUrl: string, currentUrl: string): boolean {
  try {
    const baseUrlObj = new URL(baseUrl)
    const currentUrlObj = new URL(currentUrl)
    
    return baseUrlObj.href !== currentUrlObj.href
  } catch (error) {
    return baseUrl !== currentUrl
  }
}