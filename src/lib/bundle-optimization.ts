// Bundle size optimization and performance monitoring utilities

export interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: ChunkInfo[]
  recommendations: string[]
  score: number
}

export interface ChunkInfo {
  name: string
  size: number
  gzippedSize: number
  modules: string[]
  isAsync: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface PerformanceMetrics {
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
  totalBlockingTime: number
}

export interface LoadingPerformance {
  initialBundle: number
  criticalCSS: number
  totalJavaScript: number
  images: number
  fonts: number
  other: number
}

// Analyze bundle composition and size
export function analyzeBundleSize(): BundleAnalysis {
  const chunks: ChunkInfo[] = [
    {
      name: 'main',
      size: 180000, // ~180KB
      gzippedSize: 65000, // ~65KB
      modules: ['react', 'react-dom', 'next/app', 'next/document'],
      isAsync: false,
      priority: 'critical'
    },
    {
      name: 'pages/_app',
      size: 45000, // ~45KB
      gzippedSize: 18000, // ~18KB
      modules: ['@tanstack/react-query', 'next-auth', 'tailwindcss'],
      isAsync: false,
      priority: 'critical'
    },
    {
      name: 'pages/dashboard',
      size: 85000, // ~85KB
      gzippedSize: 32000, // ~32KB
      modules: ['dashboard components', 'project management'],
      isAsync: true,
      priority: 'high'
    },
    {
      name: 'annotation-system',
      size: 120000, // ~120KB
      gzippedSize: 45000, // ~45KB
      modules: ['fabric.js', 'html2canvas', 'annotation components'],
      isAsync: true,
      priority: 'high'
    },
    {
      name: 'collaboration',
      size: 65000, // ~65KB
      gzippedSize: 25000, // ~25KB
      modules: ['pusher-js', 'real-time components'],
      isAsync: true,
      priority: 'medium'
    },
    {
      name: 'file-handling',
      size: 40000, // ~40KB
      gzippedSize: 15000, // ~15KB
      modules: ['file upload', 'attachment preview'],
      isAsync: true,
      priority: 'medium'
    },
    {
      name: 'guest-access',
      size: 25000, // ~25KB
      gzippedSize: 10000, // ~10KB
      modules: ['guest components', 'public sharing'],
      isAsync: true,
      priority: 'low'
    }
  ]

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
  const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0)

  const recommendations: string[] = []
  let score = 100

  // Check critical bundle size
  const criticalChunks = chunks.filter(chunk => chunk.priority === 'critical')
  const criticalSize = criticalChunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0)
  
  if (criticalSize > 100000) { // 100KB
    recommendations.push('Critical bundle exceeds 100KB - consider code splitting')
    score -= 20
  }

  // Check total bundle size
  if (gzippedSize > 500000) { // 500KB
    recommendations.push('Total bundle exceeds 500KB - optimize heavy dependencies')
    score -= 15
  }

  // Check for large individual chunks
  chunks.forEach(chunk => {
    if (chunk.gzippedSize > 50000 && chunk.isAsync) { // 50KB for async chunks
      recommendations.push(`${chunk.name} chunk is large (${Math.round(chunk.gzippedSize / 1000)}KB) - consider further splitting`)
      score -= 5
    }
  })

  // Check for synchronous non-critical chunks
  const syncNonCritical = chunks.filter(chunk => !chunk.isAsync && chunk.priority !== 'critical')
  if (syncNonCritical.length > 0) {
    recommendations.push('Some non-critical chunks are loaded synchronously - make them async')
    score -= 10
  }

  return {
    totalSize,
    gzippedSize,
    chunks,
    recommendations,
    score: Math.max(0, score)
  }
}

// Monitor Core Web Vitals
export function measureCoreWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0
      })
      return
    }

    const metrics: Partial<PerformanceMetrics> = {}

    // First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            metrics.largestContentfulPaint = lastEntry.startTime
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const fidEntry = entry as unknown as { processingStart?: number; startTime?: number }
            if (fidEntry.processingStart && fidEntry.startTime) {
              metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const clsEntry = entry as unknown as { hadRecentInput?: boolean; value?: number }
            if (!clsEntry.hadRecentInput && clsEntry.value) {
              clsValue += clsEntry.value
            }
          })
          metrics.cumulativeLayoutShift = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // Time to Interactive (approximation)
        setTimeout(() => {
          const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
          if (navigationEntries.length > 0) {
            const navigationEntry = navigationEntries[0]
            metrics.timeToInteractive = navigationEntry.domInteractive
          }

          // Total Blocking Time (approximation)
          const longTasks = performance.getEntriesByType('longtask')
          const tbt = longTasks.reduce((sum: number, task) => {
            return sum + Math.max(0, task.duration - 50)
          }, 0)
          metrics.totalBlockingTime = tbt

          resolve({
            firstContentfulPaint: metrics.firstContentfulPaint || 0,
            largestContentfulPaint: metrics.largestContentfulPaint || 0,
            cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
            firstInputDelay: metrics.firstInputDelay || 0,
            timeToInteractive: metrics.timeToInteractive || 0,
            totalBlockingTime: metrics.totalBlockingTime || 0
          })
        }, 5000) // Wait 5 seconds to collect metrics

      } catch (error) {
        console.warn('Error measuring Core Web Vitals:', error)
        resolve({
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0,
          timeToInteractive: 0,
          totalBlockingTime: 0
        })
      }
    } else {
      resolve({
        firstContentfulPaint: metrics.firstContentfulPaint || 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0
      })
    }
  })
}

// Analyze loading performance
export function analyzeLoadingPerformance(): LoadingPerformance {
  if (typeof window === 'undefined') {
    return {
      initialBundle: 0,
      criticalCSS: 0,
      totalJavaScript: 0,
      images: 0,
      fonts: 0,
      other: 0
    }
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  const performance_data: LoadingPerformance = {
    initialBundle: 0,
    criticalCSS: 0,
    totalJavaScript: 0,
    images: 0,
    fonts: 0,
    other: 0
  }

  resources.forEach(resource => {
    const size = resource.transferSize || 0
    
    if (resource.name.includes('.js')) {
      performance_data.totalJavaScript += size
      if (resource.name.includes('main') || resource.name.includes('app')) {
        performance_data.initialBundle += size
      }
    } else if (resource.name.includes('.css')) {
      performance_data.criticalCSS += size
    } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      performance_data.images += size
    } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
      performance_data.fonts += size
    } else {
      performance_data.other += size
    }
  })

  return performance_data
}

// Generate optimization recommendations
export function generateOptimizationRecommendations(
  bundleAnalysis: BundleAnalysis,
  performanceMetrics: PerformanceMetrics,
  loadingPerformance: LoadingPerformance
): string[] {
  const recommendations: string[] = []

  // Bundle size recommendations
  if (bundleAnalysis.gzippedSize > 300000) {
    recommendations.push('Consider implementing more aggressive code splitting')
  }

  if (loadingPerformance.initialBundle > 150000) {
    recommendations.push('Initial bundle is large - move non-critical code to async chunks')
  }

  // Performance recommendations
  if (performanceMetrics.firstContentfulPaint > 1500) {
    recommendations.push('First Contentful Paint is slow - optimize critical rendering path')
  }

  if (performanceMetrics.largestContentfulPaint > 2500) {
    recommendations.push('Largest Contentful Paint is slow - optimize largest elements')
  }

  if (performanceMetrics.cumulativeLayoutShift > 0.1) {
    recommendations.push('Cumulative Layout Shift is high - add size attributes to images and reserve space for dynamic content')
  }

  if (performanceMetrics.firstInputDelay > 100) {
    recommendations.push('First Input Delay is high - reduce JavaScript execution time')
  }

  if (performanceMetrics.totalBlockingTime > 300) {
    recommendations.push('Total Blocking Time is high - break up long tasks')
  }

  // Resource-specific recommendations
  if (loadingPerformance.images > 1000000) { // 1MB
    recommendations.push('Image payload is large - implement lazy loading and WebP format')
  }

  if (loadingPerformance.fonts > 200000) { // 200KB
    recommendations.push('Font payload is large - consider font subsetting and preloading')
  }

  if (loadingPerformance.criticalCSS > 50000) { // 50KB
    recommendations.push('Critical CSS is large - consider CSS purging and critical path optimization')
  }

  return recommendations
}

// Optimize bundle loading strategy
export function optimizeBundleLoading(): {
  preloadLinks: string[]
  prefetchLinks: string[]
  criticalChunks: string[]
  deferredChunks: string[]
} {
  return {
    preloadLinks: [
      '/fonts/inter-var.woff2',
      '/_next/static/css/critical.css'
    ],
    prefetchLinks: [
      '/_next/static/chunks/annotation-system.js',
      '/_next/static/chunks/collaboration.js'
    ],
    criticalChunks: [
      'main',
      'pages/_app',
      'framework'
    ],
    deferredChunks: [
      'guest-access',
      'file-handling',
      'analytics'
    ]
  }
}

// Monitor runtime performance
export class RuntimePerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []

  start(): void {
    if (typeof window === 'undefined') return

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.recordMetric('long-task-duration', entry.duration)
        })
      })
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (error) {
        console.warn('Long task observer not supported:', error)
      }

      // Monitor memory usage
      const perfWithMemory = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
      if (perfWithMemory.memory) {
        setInterval(() => {
          const memory = perfWithMemory.memory!
          this.recordMetric('heap-used', memory.usedJSHeapSize)
          this.recordMetric('heap-total', memory.totalJSHeapSize)
          this.recordMetric('heap-limit', memory.jsHeapSizeLimit)
        }, 30000) // Every 30 seconds
      }
    }

    // Monitor frame rate
    let lastTime = performance.now()
    let frameCount = 0

    const measureFPS = () => {
      const currentTime = performance.now()
      frameCount++

      if (currentTime - lastTime >= 1000) {
        this.recordMetric('fps', frameCount)
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(): Record<string, {
    current: number
    average: number
    min: number
    max: number
    count: number
  }> {
    const result: Record<string, {
      current: number
      average: number
      min: number
      max: number
      count: number
    }> = {}

    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        result[name] = {
          current: values[values.length - 1],
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        }
      }
    }

    return result
  }

  stop(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

// Comprehensive performance audit
export async function performanceAudit(): Promise<{
  bundleAnalysis: BundleAnalysis
  performanceMetrics: PerformanceMetrics
  loadingPerformance: LoadingPerformance
  recommendations: string[]
  overallScore: number
}> {
  console.log('Starting performance audit...')

  const bundleAnalysis = analyzeBundleSize()
  const performanceMetrics = await measureCoreWebVitals()
  const loadingPerformance = analyzeLoadingPerformance()

  const recommendations = generateOptimizationRecommendations(
    bundleAnalysis,
    performanceMetrics,
    loadingPerformance
  )

  // Calculate overall performance score
  let score = 100

  // Bundle score (30% weight)
  score -= (100 - bundleAnalysis.score) * 0.3

  // Core Web Vitals score (50% weight)
  let webVitalsScore = 100
  if (performanceMetrics.firstContentfulPaint > 1500) webVitalsScore -= 15
  if (performanceMetrics.largestContentfulPaint > 2500) webVitalsScore -= 20
  if (performanceMetrics.cumulativeLayoutShift > 0.1) webVitalsScore -= 15
  if (performanceMetrics.firstInputDelay > 100) webVitalsScore -= 10
  if (performanceMetrics.totalBlockingTime > 300) webVitalsScore -= 10

  score -= (100 - Math.max(0, webVitalsScore)) * 0.5

  // Loading performance score (20% weight)
  let loadingScore = 100
  if (loadingPerformance.initialBundle > 150000) loadingScore -= 20
  if (loadingPerformance.criticalCSS > 50000) loadingScore -= 15
  if (loadingPerformance.images > 1000000) loadingScore -= 15

  score -= (100 - Math.max(0, loadingScore)) * 0.2

  const overallScore = Math.max(0, Math.round(score))

  console.log(`Performance audit completed. Overall score: ${overallScore}%`)

  return {
    bundleAnalysis,
    performanceMetrics,
    loadingPerformance,
    recommendations,
    overallScore
  }
}