// Comprehensive testing suite for final deployment preparation

import { runComprehensiveBrowserTests } from './cross-browser-testing'
import { auditGuestAccessSecurity } from './guest-access-security'
import { performanceAudit } from './bundle-optimization'
import { checkProductionReadiness, validateProductionConfig } from './production-config'

export interface ComprehensiveTestReport {
  timestamp: Date
  environment: string
  overallScore: number
  readyForProduction: boolean
  
  browserCompatibility: {
    score: number
    supportedBrowsers: string[]
    issues: string[]
    recommendations: string[]
  }
  
  iframeFunctionality: {
    score: number
    testedUrls: number
    successfulLoads: number
    screenshotCapable: number
    crossOriginIssues: number
  }
  
  screenshotCapture: {
    score: number
    html5CanvasSupport: boolean
    crossOriginCapture: boolean
    fallbackRequired: boolean
    averageQuality: string
  }
  
  guestAccessSecurity: {
    score: number
    vulnerabilities: string[]
    recommendations: string[]
    permissionBoundariesSecure: boolean
  }
  
  performance: {
    score: number
    bundleSize: number
    coreWebVitals: {
      fcp: number
      lcp: number
      cls: number
      fid: number
    }
    recommendations: string[]
  }
  
  productionReadiness: {
    score: number
    configurationValid: boolean
    criticalIssues: string[]
    warnings: string[]
    deploymentBlockers: string[]
  }
  
  recommendations: string[]
  criticalIssues: string[]
  nextSteps: string[]
}

// Run comprehensive testing suite
export async function runComprehensiveTests(): Promise<ComprehensiveTestReport> {
  console.log('🚀 Starting comprehensive testing suite for deployment preparation...')
  
  const startTime = Date.now()
  const timestamp = new Date()
  const environment = process.env.NODE_ENV || 'development'

  // Initialize report
  const report: Partial<ComprehensiveTestReport> = {
    timestamp,
    environment,
    overallScore: 0,
    readyForProduction: false,
    recommendations: [],
    criticalIssues: [],
    nextSteps: []
  }

  try {
    // 1. Browser Compatibility Testing
    console.log('📱 Testing browser compatibility and iframe functionality...')
    const browserTests = await runComprehensiveBrowserTests()
    
    report.browserCompatibility = {
      score: browserTests.overallScore,
      supportedBrowsers: [browserTests.browserInfo.name],
      issues: browserTests.compatibilityReport.criticalIssues,
      recommendations: browserTests.compatibilityReport.recommendations
    }

    report.iframeFunctionality = {
      score: calculateIframeScore(browserTests.iframeTests),
      testedUrls: Object.keys(browserTests.iframeTests).length,
      successfulLoads: Object.values(browserTests.iframeTests).filter(test => test.canLoad).length,
      screenshotCapable: Object.values(browserTests.iframeTests).filter(test => test.canCapture).length,
      crossOriginIssues: Object.values(browserTests.iframeTests).filter(test => test.crossOriginIssues).length
    }

    report.screenshotCapture = {
      score: calculateScreenshotScore(browserTests.screenshotTests),
      html5CanvasSupport: Object.values(browserTests.screenshotTests).some(test => test.html5CanvasSupported),
      crossOriginCapture: Object.values(browserTests.screenshotTests).some(test => test.crossOriginCapture),
      fallbackRequired: Object.values(browserTests.screenshotTests).some(test => test.fallbackRequired),
      averageQuality: calculateAverageQuality(browserTests.screenshotTests)
    }

    // 2. Guest Access Security Testing
    console.log('🔒 Testing guest access security...')
    const mockGuestToken = 'test-guest-token-' + Math.random().toString(36).substring(7)
    const mockProjectId = 'test-project-id'
    
    const guestSecurityAudit = await auditGuestAccessSecurity(
      mockGuestToken,
      mockProjectId,
      {
        name: 'Test Guest User',
        email: 'test@example.com',
        content: 'Test annotation content'
      },
      new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    )

    report.guestAccessSecurity = {
      score: guestSecurityAudit.overallScore,
      vulnerabilities: guestSecurityAudit.vulnerabilities,
      recommendations: guestSecurityAudit.recommendations,
      permissionBoundariesSecure: guestSecurityAudit.tests.filter(test => 
        test.testName.includes('Permission') || test.testName.includes('Access')
      ).every(test => test.passed)
    }

    // 3. Performance Testing
    console.log('⚡ Testing performance and bundle optimization...')
    const performanceResults = await performanceAudit()

    report.performance = {
      score: performanceResults.overallScore,
      bundleSize: performanceResults.bundleAnalysis.gzippedSize,
      coreWebVitals: {
        fcp: performanceResults.performanceMetrics.firstContentfulPaint,
        lcp: performanceResults.performanceMetrics.largestContentfulPaint,
        cls: performanceResults.performanceMetrics.cumulativeLayoutShift,
        fid: performanceResults.performanceMetrics.firstInputDelay
      },
      recommendations: performanceResults.recommendations
    }

    // 4. Production Configuration Testing
    console.log('⚙️ Validating production configuration...')
    const configValidation = validateProductionConfig()
    const productionReadiness = checkProductionReadiness()

    report.productionReadiness = {
      score: configValidation.score,
      configurationValid: configValidation.valid,
      criticalIssues: configValidation.errors,
      warnings: configValidation.warnings,
      deploymentBlockers: productionReadiness.blockers
    }

    // Calculate overall score
    const scores = [
      report.browserCompatibility.score,
      report.iframeFunctionality.score,
      report.screenshotCapture.score,
      report.guestAccessSecurity.score,
      report.performance.score,
      report.productionReadiness.score
    ]

    report.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)

    // Determine production readiness
    report.readyForProduction = (
      report.overallScore >= 80 &&
      report.productionReadiness.deploymentBlockers.length === 0 &&
      report.guestAccessSecurity.vulnerabilities.filter(v => v.startsWith('CRITICAL')).length === 0
    )

    // Compile recommendations and critical issues
    report.recommendations = [
      ...report.browserCompatibility.recommendations,
      ...report.guestAccessSecurity.recommendations,
      ...report.performance.recommendations,
      ...configValidation.recommendations
    ].filter((rec, index, arr) => arr.indexOf(rec) === index) // Remove duplicates

    report.criticalIssues = [
      ...report.browserCompatibility.issues,
      ...report.guestAccessSecurity.vulnerabilities.filter(v => v.startsWith('CRITICAL')),
      ...report.productionReadiness.criticalIssues,
      ...report.productionReadiness.deploymentBlockers
    ]

    // Generate next steps
    report.nextSteps = generateNextSteps(report as ComprehensiveTestReport)

    const duration = Date.now() - startTime
    console.log(`✅ Comprehensive testing completed in ${duration}ms`)
    console.log(`📊 Overall Score: ${report.overallScore}%`)
    console.log(`🚀 Ready for Production: ${report.readyForProduction ? 'YES' : 'NO'}`)

    return report as ComprehensiveTestReport

  } catch (error) {
    console.error('❌ Error during comprehensive testing:', error)
    
    return {
      timestamp,
      environment,
      overallScore: 0,
      readyForProduction: false,
      browserCompatibility: { score: 0, supportedBrowsers: [], issues: ['Testing failed'], recommendations: [] },
      iframeFunctionality: { score: 0, testedUrls: 0, successfulLoads: 0, screenshotCapable: 0, crossOriginIssues: 0 },
      screenshotCapture: { score: 0, html5CanvasSupport: false, crossOriginCapture: false, fallbackRequired: true, averageQuality: 'failed' },
      guestAccessSecurity: { score: 0, vulnerabilities: ['Testing failed'], recommendations: [], permissionBoundariesSecure: false },
      performance: { score: 0, bundleSize: 0, coreWebVitals: { fcp: 0, lcp: 0, cls: 0, fid: 0 }, recommendations: [] },
      productionReadiness: { score: 0, configurationValid: false, criticalIssues: ['Testing failed'], warnings: [], deploymentBlockers: ['Testing failed'] },
      recommendations: ['Fix testing infrastructure and retry'],
      criticalIssues: ['Comprehensive testing failed'],
      nextSteps: ['Debug testing issues', 'Retry comprehensive testing']
    }
  }
}

// Calculate iframe functionality score
function calculateIframeScore(iframeTests: Record<string, { canLoad: boolean; canCapture: boolean; crossOriginIssues: boolean }>): number {
  const tests = Object.values(iframeTests)
  if (tests.length === 0) return 0

  const loadSuccessRate = tests.filter(test => test.canLoad).length / tests.length
  const captureSuccessRate = tests.filter(test => test.canCapture).length / tests.length
  const crossOriginIssueRate = tests.filter(test => test.crossOriginIssues).length / tests.length

  return Math.round((loadSuccessRate * 50) + (captureSuccessRate * 30) + ((1 - crossOriginIssueRate) * 20))
}

// Calculate screenshot capture score
function calculateScreenshotScore(screenshotTests: Record<string, { html5CanvasSupported: boolean; quality: string }>): number {
  const tests = Object.values(screenshotTests)
  if (tests.length === 0) return 0

  const html5Support = tests.filter(test => test.html5CanvasSupported).length / tests.length
  const qualityScore = tests.reduce((sum: number, test) => {
    switch (test.quality) {
      case 'excellent': return sum + 100
      case 'good': return sum + 75
      case 'poor': return sum + 50
      case 'failed': return sum + 0
      default: return sum + 0
    }
  }, 0) / (tests.length * 100)

  return Math.round((html5Support * 40) + (qualityScore * 60))
}

// Calculate average screenshot quality
function calculateAverageQuality(screenshotTests: Record<string, { quality: string }>): string {
  const tests = Object.values(screenshotTests)
  if (tests.length === 0) return 'unknown'

  const qualityScores = tests.map(test => {
    switch (test.quality) {
      case 'excellent': return 4
      case 'good': return 3
      case 'poor': return 2
      case 'failed': return 1
      default: return 1
    }
  })

  const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length

  if (averageScore >= 3.5) return 'excellent'
  if (averageScore >= 2.5) return 'good'
  if (averageScore >= 1.5) return 'poor'
  return 'failed'
}

// Generate next steps based on test results
function generateNextSteps(report: ComprehensiveTestReport): string[] {
  const steps: string[] = []

  if (!report.readyForProduction) {
    steps.push('Address critical issues before production deployment')
  }

  if (report.productionReadiness.deploymentBlockers.length > 0) {
    steps.push('Fix deployment blockers: ' + report.productionReadiness.deploymentBlockers.join(', '))
  }

  if (report.guestAccessSecurity.vulnerabilities.filter(v => v.startsWith('CRITICAL')).length > 0) {
    steps.push('Fix critical security vulnerabilities in guest access system')
  }

  if (report.performance.score < 70) {
    steps.push('Optimize performance - focus on bundle size and Core Web Vitals')
  }

  if (report.browserCompatibility.score < 80) {
    steps.push('Improve browser compatibility and iframe functionality')
  }

  if (report.screenshotCapture.fallbackRequired) {
    steps.push('Implement server-side screenshot fallback for cross-origin content')
  }

  if (report.overallScore >= 80 && report.readyForProduction) {
    steps.push('Run final deployment checklist')
    steps.push('Deploy to staging environment for final testing')
    steps.push('Prepare production deployment')
  }

  if (steps.length === 0) {
    steps.push('All tests passed - ready for production deployment!')
  }

  return steps
}

// Generate detailed test report
export function generateTestReport(report: ComprehensiveTestReport): string {
  const sections = [
    '# PixelPin Deployment Readiness Report',
    `Generated: ${report.timestamp.toISOString()}`,
    `Environment: ${report.environment}`,
    `Overall Score: ${report.overallScore}%`,
    `Ready for Production: ${report.readyForProduction ? '✅ YES' : '❌ NO'}`,
    '',
    '## Browser Compatibility',
    `Score: ${report.browserCompatibility.score}%`,
    `Supported Browsers: ${report.browserCompatibility.supportedBrowsers.join(', ')}`,
    `Issues: ${report.browserCompatibility.issues.length}`,
    '',
    '## Iframe Functionality',
    `Score: ${report.iframeFunctionality.score}%`,
    `Tested URLs: ${report.iframeFunctionality.testedUrls}`,
    `Successful Loads: ${report.iframeFunctionality.successfulLoads}/${report.iframeFunctionality.testedUrls}`,
    `Screenshot Capable: ${report.iframeFunctionality.screenshotCapable}/${report.iframeFunctionality.testedUrls}`,
    `Cross-Origin Issues: ${report.iframeFunctionality.crossOriginIssues}`,
    '',
    '## Screenshot Capture',
    `Score: ${report.screenshotCapture.score}%`,
    `HTML5 Canvas Support: ${report.screenshotCapture.html5CanvasSupport ? '✅' : '❌'}`,
    `Cross-Origin Capture: ${report.screenshotCapture.crossOriginCapture ? '✅' : '❌'}`,
    `Fallback Required: ${report.screenshotCapture.fallbackRequired ? '⚠️ Yes' : '✅ No'}`,
    `Average Quality: ${report.screenshotCapture.averageQuality}`,
    '',
    '## Guest Access Security',
    `Score: ${report.guestAccessSecurity.score}%`,
    `Permission Boundaries Secure: ${report.guestAccessSecurity.permissionBoundariesSecure ? '✅' : '❌'}`,
    `Vulnerabilities: ${report.guestAccessSecurity.vulnerabilities.length}`,
    '',
    '## Performance',
    `Score: ${report.performance.score}%`,
    `Bundle Size: ${Math.round(report.performance.bundleSize / 1000)}KB (gzipped)`,
    `First Contentful Paint: ${Math.round(report.performance.coreWebVitals.fcp)}ms`,
    `Largest Contentful Paint: ${Math.round(report.performance.coreWebVitals.lcp)}ms`,
    `Cumulative Layout Shift: ${report.performance.coreWebVitals.cls.toFixed(3)}`,
    `First Input Delay: ${Math.round(report.performance.coreWebVitals.fid)}ms`,
    '',
    '## Production Readiness',
    `Score: ${report.productionReadiness.score}%`,
    `Configuration Valid: ${report.productionReadiness.configurationValid ? '✅' : '❌'}`,
    `Critical Issues: ${report.productionReadiness.criticalIssues.length}`,
    `Deployment Blockers: ${report.productionReadiness.deploymentBlockers.length}`,
    '',
    '## Critical Issues',
    ...report.criticalIssues.map(issue => `- ❌ ${issue}`),
    '',
    '## Recommendations',
    ...report.recommendations.slice(0, 10).map(rec => `- 💡 ${rec}`),
    '',
    '## Next Steps',
    ...report.nextSteps.map((step, index) => `${index + 1}. ${step}`)
  ]

  return sections.join('\n')
}

// Save test report to file
export async function saveTestReport(report: ComprehensiveTestReport): Promise<void> {
  const reportContent = generateTestReport(report)
  const filename = `deployment-readiness-${report.timestamp.toISOString().split('T')[0]}.md`
  
  try {
    // In a real implementation, you would save this to a file system or cloud storage
    console.log(`📄 Test report generated: ${filename}`)
    console.log('Report content:')
    console.log(reportContent)
  } catch (error) {
    console.error('Failed to save test report:', error)
  }
}

// Quick deployment readiness check
export async function quickDeploymentCheck(): Promise<{
  ready: boolean
  score: number
  blockers: string[]
  warnings: string[]
}> {
  console.log('🔍 Running quick deployment readiness check...')

  const configValidation = validateProductionConfig()
  const productionReadiness = checkProductionReadiness()

  const ready = (
    configValidation.valid &&
    productionReadiness.ready &&
    configValidation.score >= 80
  )

  return {
    ready,
    score: configValidation.score,
    blockers: [
      ...configValidation.errors,
      ...productionReadiness.blockers
    ],
    warnings: [
      ...configValidation.warnings,
      ...productionReadiness.warnings
    ]
  }
}