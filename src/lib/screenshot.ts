import html2canvas from 'html2canvas'

export interface ScreenshotOptions {
  element?: HTMLElement
  width?: number
  height?: number
  quality?: number
}

export interface ScreenshotResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
}

/**
 * Capture screenshot of iframe content using html2canvas
 * This is the primary method for capturing screenshots of iframe content
 */
export async function captureIframeScreenshot(
  iframe: HTMLIFrameElement,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  try {
    // Get iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      throw new Error('Cannot access iframe content - likely cross-origin')
    }

    // Capture the iframe body
    const canvas = await html2canvas(iframeDoc.body, {
      allowTaint: true,
      useCORS: true,
      scale: 1,
      width: options.width || iframe.clientWidth,
      height: options.height || iframe.clientHeight,
      scrollX: 0,
      scrollY: 0
    })

    // Convert to blob
    const dataUrl = canvas.toDataURL('image/png', options.quality || 0.9)
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas')
        }
        
        resolve({
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height
        })
      }, 'image/png', options.quality || 0.9)
    })

  } catch (error) {
    console.error('Client-side screenshot capture failed:', error)
    throw error
  }
}

/**
 * Capture screenshot of any DOM element
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  try {
    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 1,
      width: options.width || element.clientWidth,
      height: options.height || element.clientHeight
    })

    const dataUrl = canvas.toDataURL('image/png', options.quality || 0.9)
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas')
        }
        
        resolve({
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height
        })
      }, 'image/png', options.quality || 0.9)
    })

  } catch (error) {
    console.error('Element screenshot capture failed:', error)
    throw error
  }
}

/**
 * Upload screenshot blob to the server
 */
export async function uploadScreenshot(blob: Blob): Promise<{
  url: string
  filename: string
  size: number
}> {
  const formData = new FormData()
  formData.append('image', blob, 'screenshot.png')

  const response = await fetch('/api/screenshots', {
    method: 'PUT',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload screenshot')
  }

  return response.json()
}

/**
 * Server-side screenshot capture using Puppeteer (fallback for cross-origin)
 */
export async function captureServerScreenshot(
  url: string,
  viewport?: { width: number; height: number }
): Promise<{
  url: string
  filename: string
  size: number
}> {
  const response = await fetch('/api/screenshots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      viewport,
      fullPage: false
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to capture server screenshot')
  }

  return response.json()
}

/**
 * Main screenshot capture function with fallback strategy
 */
export async function captureScreenshot(
  iframe: HTMLIFrameElement,
  fallbackUrl?: string
): Promise<{
  url: string
  filename: string
  size: number
}> {
  try {
    // Try client-side capture first
    const result = await captureIframeScreenshot(iframe)
    return await uploadScreenshot(result.blob)
    
  } catch (clientError) {
    console.warn('Client-side screenshot failed, trying server-side:', clientError)
    
    if (!fallbackUrl) {
      throw new Error('Client-side capture failed and no fallback URL provided')
    }

    try {
      // Fallback to server-side capture
      return await captureServerScreenshot(fallbackUrl, {
        width: iframe.clientWidth,
        height: iframe.clientHeight
      })
      
    } catch (serverError) {
      console.error('Server-side screenshot also failed:', serverError)
      throw new Error('Both client-side and server-side screenshot capture failed')
    }
  }
}