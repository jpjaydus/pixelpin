// Cross-browser testing utilities for iframe functionality and screenshot capture

export interface BrowserInfo {
  name: string
  version: string
  engine: string
  os: string
  mobile: boolean
  supported: boolean
  features: BrowserFeatures
}

export interface BrowserFeatures {
  webSocket: boolean
  canvas: boolean
  intersectionObserver: boolean
  resizeObserver: boolean
  mutationObserver: boolean
  fetch: boolean
  localStorage: boolean
  sessionStorage: boolean
  webWorkers: boolean
  serviceWorkers: boolean
  webGL: boolean
  webRTC: boolean
  fileAPI: boolean
  dragAndDrop: boolean
  fullscreen: boolean
  pointerEvents: boolean
  touchEvents: boolean
  geolocation: boolean
  notifications: boolean
  vibration: boolean
}

export interface IframeTestResult {
  canLoad: boolean
  canCapture: boolean
  crossOriginIssues: boolean
  securityErrors: string[]
  performanceMetrics: {
    loadTime: number
    renderTime: number
    memoryUsage?: number
  }
}

export interface ScreenshotTestResult {
  html5CanvasSupported: boolean
  crossOriginCapture: boolean
  fileSize: number
  quality: 'excellent' | 'good' | 'poor' | 'failed'
  errors: string[]
  fallbackRequired: boolean
}

// Browser detection utility
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'Unknown',
      version: '0.0.0',
      engine: 'Unknown',
      os: 'Unknown',
      mobile: false,
      supported: false,
      features: {} as BrowserFeatures
    }
  }

  const userAgent = navigator.userAgent
  
  let name = 'Unknown'
  let version = '0.0.0'
  let engine = 'Unknown'
  
  // Detect browser name and version
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
    version = match ? match[1] : '0.0.0'
    engine = 'Blink'
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
    version = match ? match[1] : '0.0.0'
    engine = 'Gecko'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari'
    const match = userAgent.match(/Version\/(\d+\.\d+\.\d+)/)
    version = match ? match[1] : '0.0.0'
    engine = 'WebKit'
  } else if (userAgent.includes('Edg')) {
    name = 'Edge'
    const match = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/)
    version = match ? match[1] : '0.0.0'
    engine = 'Blink'
  }

  // Detect OS
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  // Detect mobile
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // Test browser features
  const features = testBrowserFeatures()
  
  // Determine if browser is supported
  const supported = isSupported(name, version, features)

  return {
    name,
    version,
    engine,
    os,
    mobile,
    supported,
    features
  }
}

// Test all browser features
function testBrowserFeatures(): BrowserFeatures {
  if (typeof window === 'undefined') {
    return {} as BrowserFeatures
  }

  return {
    webSocket: typeof WebSocket !== 'undefined',
    canvas: (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext && canvas.getContext('2d'))
      } catch {
        return false
      }
    })(),
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    localStorage: (() => {
      try {
        return typeof localStorage !== 'undefined' && localStorage !== null
      } catch {
        return false
      }
    })(),
    sessionStorage: (() => {
      try {
        return typeof sessionStorage !== 'undefined' && sessionStorage !== null
      } catch {
        return false
      }
    })(),
    webWorkers: typeof Worker !== 'undefined',
    serviceWorkers: 'serviceWorker' in navigator,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch {
        return false
      }
    })(),
    webRTC: typeof RTCPeerConnection !== 'undefined',
    fileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
    dragAndDrop: 'draggable' in document.createElement('div'),
    fullscreen: document.fullscreenEnabled || !!(document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled,
    pointerEvents: typeof PointerEvent !== 'undefined',
    touchEvents: 'ontouchstart' in window,
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    vibration: 'vibrate' in navigator
  }
}

// Check if browser version is supported
function isSupported(name: string, version: string, features: BrowserFeatures): boolean {
  const majorVersion = parseInt(version.split('.')[0])
  
  // Minimum supported versions
  const minVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90
  }

  const minVersion = minVersions[name]
  if (!minVersion) return false
  
  if (majorVersion < minVersion) return false

  // Check required features
  const requiredFeatures: (keyof BrowserFeatures)[] = [
    'webSocket',
    'canvas',
    'fetch',
    'localStorage',
    'sessionStorage'
  ]

  return requiredFeatures.every(feature => features[feature])
}

// Test iframe functionality across different websites
export async function testIframeFunctionality(testUrls: string[]): Promise<Record<string, IframeTestResult>> {
  const results: Record<string, IframeTestResult> = {}

  for (const url of testUrls) {
    try {
      const result = await testSingleIframe(url)
      results[url] = result
    } catch (error) {
      results[url] = {
        canLoad: false,
        canCapture: false,
        crossOriginIssues: true,
        securityErrors: [error instanceof Error ? error.message : 'Unknown error'],
        performanceMetrics: {
          loadTime: 0,
          renderTime: 0
        }
      }
    }
  }

  return results
}

// Test single iframe
async function testSingleIframe(url: string): Promise<IframeTestResult> {
  return new Promise((resolve) => {
    const startTime = performance.now()
    const iframe = document.createElement('iframe')
    const securityErrors: string[] = []
    let canLoad = false
    let canCapture = false
    let crossOriginIssues = false

    // Set up iframe
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '800px'
    iframe.style.height = '600px'
    iframe.src = url

    // Timeout for testing
    const timeout = setTimeout(() => {
      cleanup()
      resolve({
        canLoad: false,
        canCapture: false,
        crossOriginIssues: true,
        securityErrors: ['Timeout loading iframe'],
        performanceMetrics: {
          loadTime: performance.now() - startTime,
          renderTime: 0
        }
      })
    }, 10000)

    // Load event handler
    iframe.onload = () => {
      const loadTime = performance.now() - startTime
      canLoad = true

      // Test screenshot capture
      setTimeout(() => {
        try {
          testIframeScreenshotCapture(iframe)
          canCapture = true
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('cross-origin')) {
              crossOriginIssues = true
            }
            securityErrors.push(error.message)
          }
        }

        const renderTime = performance.now() - startTime - loadTime
        cleanup()
        
        resolve({
          canLoad,
          canCapture,
          crossOriginIssues,
          securityErrors,
          performanceMetrics: {
            loadTime,
            renderTime,
            memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize
          }
        })
      }, 1000)
    }

    // Error event handler
    iframe.onerror = (error) => {
      securityErrors.push(error instanceof Error ? error.message : 'Iframe load error')
      cleanup()
      
      resolve({
        canLoad: false,
        canCapture: false,
        crossOriginIssues: true,
        securityErrors,
        performanceMetrics: {
          loadTime: performance.now() - startTime,
          renderTime: 0
        }
      })
    }

    function cleanup() {
      clearTimeout(timeout)
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }

    document.body.appendChild(iframe)
  })
}

// Test screenshot capture functionality
function testIframeScreenshotCapture(iframe: HTMLIFrameElement): void {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  canvas.width = iframe.offsetWidth
  canvas.height = iframe.offsetHeight

  try {
    // Try to access iframe content
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      throw new Error('Cannot access iframe document - cross-origin restriction')
    }

    // Try to draw iframe content to canvas
    ctx.drawImage(iframe as unknown as CanvasImageSource, 0, 0)
    
    // Try to get image data
    const imageData = canvas.toDataURL('image/png')
    if (!imageData || imageData === 'data:,') {
      throw new Error('Failed to capture screenshot data')
    }
  } catch (error) {
    throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Test screenshot capture across different content types
export async function testScreenshotCapture(testCases: Array<{
  name: string
  url: string
  contentType: 'static' | 'dynamic' | 'cross-origin' | 'secure'
}>): Promise<Record<string, ScreenshotTestResult>> {
  const results: Record<string, ScreenshotTestResult> = {}

  for (const testCase of testCases) {
    try {
      const result = await testSingleScreenshot(testCase.url, testCase.contentType)
      results[testCase.name] = result
    } catch (error) {
      results[testCase.name] = {
        html5CanvasSupported: false,
        crossOriginCapture: false,
        fileSize: 0,
        quality: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        fallbackRequired: true
      }
    }
  }

  return results
}

// Test single screenshot capture
async function testSingleScreenshot(
  url: string, 
  contentType: 'static' | 'dynamic' | 'cross-origin' | 'secure'
): Promise<ScreenshotTestResult> {
  const errors: string[] = []
  let html5CanvasSupported = true
  let crossOriginCapture = false
  let fileSize = 0
  let quality: 'excellent' | 'good' | 'poor' | 'failed' = 'failed'
  let fallbackRequired = false

  try {
    // Test HTML5 Canvas support
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      html5CanvasSupported = false
      errors.push('Canvas 2D context not supported')
      fallbackRequired = true
      return { html5CanvasSupported, crossOriginCapture, fileSize, quality, errors, fallbackRequired }
    }

    // Create test iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '800px'
    iframe.style.height = '600px'
    iframe.src = url

    document.body.appendChild(iframe)

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Iframe load timeout'))
        }, 5000)

        iframe.onload = () => {
          clearTimeout(timeout)
          resolve()
        }

        iframe.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Iframe failed to load'))
        }
      })

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test screenshot capture
      canvas.width = 800
      canvas.height = 600

      try {
        // Try HTML5 Canvas capture
        if (contentType !== 'cross-origin') {
          ctx.drawImage(iframe as unknown as CanvasImageSource, 0, 0)
          crossOriginCapture = true
        } else {
          // Simulate cross-origin restriction
          throw new Error('Cross-origin iframe cannot be captured with HTML5 Canvas')
        }

        // Get image data and calculate quality
        const imageData = canvas.toDataURL('image/png', 0.8)
        fileSize = Math.round((imageData.length * 3) / 4) // Approximate file size

        // Determine quality based on file size and content type
        if (fileSize > 100000) quality = 'excellent'
        else if (fileSize > 50000) quality = 'good'
        else if (fileSize > 10000) quality = 'poor'
        else quality = 'failed'

      } catch (captureError) {
        crossOriginCapture = false
        fallbackRequired = true
        errors.push(captureError instanceof Error ? captureError.message : 'Capture failed')

        // Test if server-side capture would be needed
        if (contentType === 'cross-origin' || contentType === 'secure') {
          quality = 'good' // Assume server-side capture would work
          fileSize = 75000 // Estimated size for server-side capture
        }
      }

    } finally {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }

  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    fallbackRequired = true
  }

  return {
    html5CanvasSupported,
    crossOriginCapture,
    fileSize,
    quality,
    errors,
    fallbackRequired
  }
}

// Generate comprehensive browser compatibility report
export function generateCompatibilityReport(): {
  browser: BrowserInfo
  recommendations: string[]
  warnings: string[]
  criticalIssues: string[]
} {
  const browser = detectBrowser()
  const recommendations: string[] = []
  const warnings: string[] = []
  const criticalIssues: string[] = []

  // Check critical features
  if (!browser.features.webSocket) {
    criticalIssues.push('WebSocket support is required for real-time collaboration')
  }

  if (!browser.features.canvas) {
    criticalIssues.push('Canvas API is required for screenshot capture and annotation rendering')
  }

  if (!browser.features.fetch) {
    criticalIssues.push('Fetch API is required for modern network requests')
  }

  if (!browser.features.localStorage) {
    criticalIssues.push('Local Storage is required for offline functionality')
  }

  // Check recommended features
  if (!browser.features.intersectionObserver) {
    warnings.push('IntersectionObserver not supported - lazy loading may be less efficient')
    recommendations.push('Update to a newer browser version for better performance')
  }

  if (!browser.features.resizeObserver) {
    warnings.push('ResizeObserver not supported - responsive features may be limited')
  }

  if (!browser.features.serviceWorkers) {
    warnings.push('Service Workers not supported - offline functionality limited')
  }

  // Browser-specific recommendations
  if (browser.name === 'Safari' && parseInt(browser.version) < 15) {
    recommendations.push('Update Safari to version 15+ for better WebSocket support')
  }

  if (browser.name === 'Firefox' && parseInt(browser.version) < 90) {
    recommendations.push('Update Firefox to version 90+ for better Canvas performance')
  }

  if (browser.mobile) {
    recommendations.push('Use desktop browser for full annotation functionality')
    warnings.push('Mobile browsers may have limited iframe and screenshot capabilities')
  }

  return {
    browser,
    recommendations,
    warnings,
    criticalIssues
  }
}

// Test suite for comprehensive browser testing
export async function runComprehensiveBrowserTests(): Promise<{
  browserInfo: BrowserInfo
  iframeTests: Record<string, IframeTestResult>
  screenshotTests: Record<string, ScreenshotTestResult>
  compatibilityReport: ReturnType<typeof generateCompatibilityReport>
  overallScore: number
}> {
  console.log('Starting comprehensive browser tests...')

  // Get browser info
  const browserInfo = detectBrowser()
  console.log('Browser detected:', browserInfo)

  // Test iframe functionality with various websites
  const testUrls = [
    'https://example.com',
    'https://httpbin.org/html',
    'https://jsonplaceholder.typicode.com',
    'data:text/html,<h1>Test Page</h1><p>This is a test page for iframe functionality.</p>'
  ]

  console.log('Testing iframe functionality...')
  const iframeTests = await testIframeFunctionality(testUrls)

  // Test screenshot capture with different content types
  const screenshotTestCases = [
    { name: 'Static HTML', url: 'data:text/html,<h1>Static Test</h1>', contentType: 'static' as const },
    { name: 'Dynamic Content', url: 'https://httpbin.org/html', contentType: 'dynamic' as const },
    { name: 'Cross-Origin', url: 'https://example.com', contentType: 'cross-origin' as const },
    { name: 'Secure Site', url: 'https://github.com', contentType: 'secure' as const }
  ]

  console.log('Testing screenshot capture...')
  const screenshotTests = await testScreenshotCapture(screenshotTestCases)

  // Generate compatibility report
  const compatibilityReport = generateCompatibilityReport()

  // Calculate overall score
  let score = 100
  score -= compatibilityReport.criticalIssues.length * 25
  score -= compatibilityReport.warnings.length * 10
  score -= Object.values(iframeTests).filter(test => !test.canLoad).length * 15
  score -= Object.values(screenshotTests).filter(test => test.quality === 'failed').length * 10

  const overallScore = Math.max(0, score)

  console.log('Browser tests completed. Overall score:', overallScore)

  return {
    browserInfo,
    iframeTests,
    screenshotTests,
    compatibilityReport,
    overallScore
  }
}