// Deployment configuration and optimization utilities

export const DEPLOYMENT_CONFIG = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isPreview: process.env.VERCEL_ENV === 'preview',
  
  // Feature flags
  features: {
    realTimeCollaboration: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
    guestAccess: process.env.NEXT_PUBLIC_ENABLE_GUEST_ACCESS !== 'false',
    fileAttachments: process.env.NEXT_PUBLIC_ENABLE_ATTACHMENTS !== 'false',
    webhooks: process.env.NEXT_PUBLIC_ENABLE_WEBHOOKS === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
  
  // Performance settings
  performance: {
    maxAnnotationsPerPage: parseInt(process.env.NEXT_PUBLIC_MAX_ANNOTATIONS_PER_PAGE || '50'),
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
    cacheTimeout: parseInt(process.env.NEXT_PUBLIC_CACHE_TIMEOUT || '300000'), // 5 minutes
    realtimeReconnectDelay: parseInt(process.env.NEXT_PUBLIC_REALTIME_RECONNECT_DELAY || '1000'),
  },
  
  // Security settings
  security: {
    allowedOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [],
    maxGuestAnnotations: parseInt(process.env.NEXT_PUBLIC_MAX_GUEST_ANNOTATIONS || '10'),
    sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '86400000'), // 24 hours
  }
}

// Browser compatibility check
export function checkBrowserSupport(): {
  supported: boolean
  missing: string[]
  warnings: string[]
} {
  if (typeof window === 'undefined') {
    return { supported: true, missing: [], warnings: [] }
  }

  const missing: string[] = []
  const warnings: string[] = []

  // Required features
  const requiredFeatures = [
    { name: 'fetch', check: () => typeof fetch !== 'undefined' },
    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
    { name: 'WebSocket', check: () => typeof WebSocket !== 'undefined' },
    { name: 'localStorage', check: () => typeof localStorage !== 'undefined' },
    { name: 'sessionStorage', check: () => typeof sessionStorage !== 'undefined' },
    { name: 'Canvas', check: () => {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext && canvas.getContext('2d'))
    }},
  ]

  // Optional but recommended features
  const recommendedFeatures = [
    { name: 'IntersectionObserver', check: () => typeof IntersectionObserver !== 'undefined' },
    { name: 'ResizeObserver', check: () => typeof ResizeObserver !== 'undefined' },
    { name: 'MutationObserver', check: () => typeof MutationObserver !== 'undefined' },
    { name: 'requestAnimationFrame', check: () => typeof requestAnimationFrame !== 'undefined' },
  ]

  // Check required features
  for (const feature of requiredFeatures) {
    if (!feature.check()) {
      missing.push(feature.name)
    }
  }

  // Check recommended features
  for (const feature of recommendedFeatures) {
    if (!feature.check()) {
      warnings.push(feature.name)
    }
  }

  return {
    supported: missing.length === 0,
    missing,
    warnings
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label: string): {
    count: number
    average: number
    min: number
    max: number
    latest: number
  } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) {
      return null
    }

    return {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    }
  }

  getAllMetrics(): Record<string, ReturnType<PerformanceMonitor['getMetrics']>> {
    const result: Record<string, ReturnType<PerformanceMonitor['getMetrics']>> = {}
    
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label)
    }
    
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Bundle size optimization
export function optimizeBundle() {
  if (DEPLOYMENT_CONFIG.isDevelopment) {
    return
  }

  // Dynamic imports for heavy components
  const dynamicImports = {
    // Lazy load heavy annotation components
    ImmersiveAnnotationView: () => import('@/components/annotation/ImmersiveAnnotationView'),
    AttachmentPreview: () => import('@/components/annotation/AttachmentPreview'),
    MentionTextarea: () => import('@/components/annotation/MentionTextarea'),
    
    // Lazy load collaboration features
    CollaboratorPresence: () => import('@/components/annotation/CollaboratorPresence'),
    ReplyThread: () => import('@/components/annotation/ReplyThread'),
    
    // Lazy load performance components
    VirtualizedList: () => import('@/components/ui/VirtualizedList'),
    LazyImage: () => import('@/components/ui/LazyImage'),
  }

  return dynamicImports
}

// Health check endpoint data
export function getHealthCheckData() {
  const browserSupport = checkBrowserSupport()
  const performanceMonitor = PerformanceMonitor.getInstance()
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    features: DEPLOYMENT_CONFIG.features,
    browserSupport,
    performance: performanceMonitor.getAllMetrics(),
    config: {
      maxAnnotationsPerPage: DEPLOYMENT_CONFIG.performance.maxAnnotationsPerPage,
      maxFileSize: DEPLOYMENT_CONFIG.performance.maxFileSize,
      cacheTimeout: DEPLOYMENT_CONFIG.performance.cacheTimeout,
    }
  }
}

// Error reporting for production
export function reportError(error: Error, context?: Record<string, any>) {
  if (DEPLOYMENT_CONFIG.isDevelopment) {
    console.error('Error:', error, context)
    return
  }

  // In production, you would send to an error tracking service
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    context
  }

  // Example: Send to error tracking service
  // fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorData)
  // }).catch(console.error)

  console.error('Production Error:', errorData)
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // Preload critical fonts
  const fontLinks = [
    '/fonts/inter-var.woff2',
    '/fonts/inter-var-italic.woff2'
  ]

  fontLinks.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.appendChild(link)
  })

  // Preload critical images
  const criticalImages = [
    '/images/logo.svg',
    '/images/empty-state.svg'
  ]

  criticalImages.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })
}

// Initialize deployment optimizations
export function initializeDeployment() {
  if (typeof window === 'undefined') return

  // Check browser compatibility
  const browserSupport = checkBrowserSupport()
  if (!browserSupport.supported) {
    console.warn('Browser compatibility issues detected:', browserSupport.missing)
  }

  if (browserSupport.warnings.length > 0) {
    console.info('Recommended browser features missing:', browserSupport.warnings)
  }

  // Initialize performance monitoring
  const performanceMonitor = PerformanceMonitor.getInstance()
  
  // Monitor page load time
  if (performance.timing) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    performanceMonitor.recordMetric('page_load_time', loadTime)
  }

  // Preload critical resources
  preloadCriticalResources()

  // Set up error reporting
  window.addEventListener('error', (event) => {
    reportError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    })
  })

  console.log('PixelPin deployment initialized', {
    environment: process.env.NODE_ENV,
    features: DEPLOYMENT_CONFIG.features,
    browserSupport: browserSupport.supported
  })
}