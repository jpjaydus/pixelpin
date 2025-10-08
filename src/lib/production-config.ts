// Production environment configuration and validation utilities

export interface ProductionConfig {
  database: DatabaseConfig
  authentication: AuthConfig
  storage: StorageConfig
  realtime: RealtimeConfig
  security: SecurityConfig
  performance: PerformanceConfig
  monitoring: MonitoringConfig
  features: FeatureFlags
}

export interface DatabaseConfig {
  url: string
  poolSize: number
  connectionTimeout: number
  ssl: boolean
  backupEnabled: boolean
}

export interface AuthConfig {
  secret: string
  url: string
  providers: string[]
  sessionTimeout: number
  csrfProtection: boolean
}

export interface StorageConfig {
  blobToken: string
  maxFileSize: number
  allowedTypes: string[]
  cdnEnabled: boolean
}

export interface RealtimeConfig {
  enabled: boolean
  appId?: string
  key?: string
  secret?: string
  cluster?: string
  maxConnections: number
}

export interface SecurityConfig {
  httpsOnly: boolean
  corsOrigins: string[]
  rateLimiting: boolean
  contentSecurityPolicy: boolean
  xssProtection: boolean
}

export interface PerformanceConfig {
  caching: boolean
  compression: boolean
  imageOptimization: boolean
  bundleAnalysis: boolean
  preloading: boolean
}

export interface MonitoringConfig {
  errorTracking: boolean
  performanceMonitoring: boolean
  uptime: boolean
  logging: boolean
}

export interface FeatureFlags {
  guestAccess: boolean
  realTimeCollaboration: boolean
  fileAttachments: boolean
  webhooks: boolean
  analytics: boolean
  betaFeatures: boolean
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
  score: number
}

// Validate production configuration
export function validateProductionConfig(): ConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'BLOB_READ_WRITE_TOKEN'
  ]

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
      score -= 20
    }
  })

  // Validate database configuration
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      errors.push('DATABASE_URL must be a PostgreSQL connection string')
      score -= 15
    }
    
    if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      warnings.push('Database URL appears to be localhost - ensure this is correct for production')
      score -= 5
    }

    if (!databaseUrl.includes('ssl=true') && !databaseUrl.includes('sslmode=require')) {
      warnings.push('Database connection should use SSL in production')
      score -= 10
    }
  }

  // Validate authentication configuration
  const authSecret = process.env.NEXTAUTH_SECRET
  if (authSecret) {
    if (authSecret.length < 32) {
      errors.push('NEXTAUTH_SECRET should be at least 32 characters long')
      score -= 15
    }
    
    if (authSecret === 'your-secret-key' || authSecret === 'development') {
      errors.push('NEXTAUTH_SECRET appears to be a default/development value')
      score -= 20
    }
  }

  const authUrl = process.env.NEXTAUTH_URL
  if (authUrl) {
    if (!authUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      errors.push('NEXTAUTH_URL must use HTTPS in production')
      score -= 15
    }
    
    if (authUrl.includes('localhost') || authUrl.includes('127.0.0.1')) {
      warnings.push('NEXTAUTH_URL appears to be localhost - ensure this is correct for production')
      score -= 5
    }
  }

  // Validate storage configuration
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    if (blobToken.length < 20) {
      warnings.push('BLOB_READ_WRITE_TOKEN appears to be too short')
      score -= 5
    }
  }

  // Check optional but recommended variables
  const recommendedVars = [
    'PUSHER_APP_ID',
    'PUSHER_KEY', 
    'PUSHER_SECRET',
    'PUSHER_CLUSTER'
  ]

  const missingRecommended = recommendedVars.filter(varName => !process.env[varName])
  if (missingRecommended.length > 0) {
    warnings.push(`Missing recommended environment variables for real-time features: ${missingRecommended.join(', ')}`)
    score -= 5
  }

  // Check security configurations
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to "production"')
    score -= 10
  }

  // Check feature flags
  const featureFlags = getFeatureFlags()
  if (featureFlags.betaFeatures && process.env.NODE_ENV === 'production') {
    warnings.push('Beta features are enabled in production')
    score -= 5
  }

  // Generate recommendations
  if (score < 90) {
    recommendations.push('Review and fix configuration issues before deploying to production')
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    recommendations.push('Configuration looks good for production deployment')
  }

  if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_PUBLISHABLE_KEY) {
    recommendations.push('Consider setting up Stripe for subscription management')
  }

  if (!process.env.SENTRY_DSN && !process.env.BUGSNAG_API_KEY) {
    recommendations.push('Consider setting up error tracking for production monitoring')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations,
    score: Math.max(0, score)
  }
}

// Get current production configuration
export function getProductionConfig(): ProductionConfig {
  return {
    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
      ssl: process.env.DATABASE_SSL !== 'false',
      backupEnabled: process.env.DATABASE_BACKUP_ENABLED === 'true'
    },
    authentication: {
      secret: process.env.NEXTAUTH_SECRET || '',
      url: process.env.NEXTAUTH_URL || '',
      providers: (process.env.AUTH_PROVIDERS || 'credentials').split(','),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000'), // 24 hours
      csrfProtection: process.env.CSRF_PROTECTION !== 'false'
    },
    storage: {
      blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,application/pdf').split(','),
      cdnEnabled: process.env.CDN_ENABLED === 'true'
    },
    realtime: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      maxConnections: parseInt(process.env.REALTIME_MAX_CONNECTIONS || '1000')
    },
    security: {
      httpsOnly: process.env.HTTPS_ONLY !== 'false',
      corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
      rateLimiting: process.env.RATE_LIMITING !== 'false',
      contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
      xssProtection: process.env.XSS_PROTECTION !== 'false'
    },
    performance: {
      caching: process.env.CACHING_ENABLED !== 'false',
      compression: process.env.COMPRESSION_ENABLED !== 'false',
      imageOptimization: process.env.IMAGE_OPTIMIZATION !== 'false',
      bundleAnalysis: process.env.BUNDLE_ANALYSIS === 'true',
      preloading: process.env.PRELOADING_ENABLED !== 'false'
    },
    monitoring: {
      errorTracking: !!process.env.SENTRY_DSN || !!process.env.BUGSNAG_API_KEY,
      performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true',
      uptime: process.env.UPTIME_MONITORING === 'true',
      logging: process.env.LOGGING_ENABLED !== 'false'
    },
    features: getFeatureFlags()
  }
}

// Get feature flags
export function getFeatureFlags(): FeatureFlags {
  return {
    guestAccess: process.env.NEXT_PUBLIC_ENABLE_GUEST_ACCESS !== 'false',
    realTimeCollaboration: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
    fileAttachments: process.env.NEXT_PUBLIC_ENABLE_ATTACHMENTS !== 'false',
    webhooks: process.env.NEXT_PUBLIC_ENABLE_WEBHOOKS === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    betaFeatures: process.env.NEXT_PUBLIC_ENABLE_BETA === 'true'
  }
}

// Generate security headers for production
export function getSecurityHeaders(): Record<string, string> {
  const config = getProductionConfig()
  
  const headers: Record<string, string> = {}

  if (config.security.httpsOnly) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  if (config.security.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com https://sockjs-us2.pusher.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: https:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }

  if (config.security.xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Frame-Options'] = 'DENY'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
  }

  headers['Permissions-Policy'] = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ')

  return headers
}

// Check production readiness
export function checkProductionReadiness(): {
  ready: boolean
  blockers: string[]
  warnings: string[]
  checklist: Array<{ item: string; status: 'pass' | 'fail' | 'warning' }>
} {
  const blockers: string[] = []
  const warnings: string[] = []
  const checklist: Array<{ item: string; status: 'pass' | 'fail' | 'warning' }> = []

  const config = getProductionConfig()
  const validation = validateProductionConfig()

  // Critical checks
  checklist.push({
    item: 'Environment variables configured',
    status: validation.errors.length === 0 ? 'pass' : 'fail'
  })

  if (validation.errors.length > 0) {
    blockers.push('Missing or invalid environment variables')
  }

  checklist.push({
    item: 'Database connection configured',
    status: config.database.url ? 'pass' : 'fail'
  })

  if (!config.database.url) {
    blockers.push('Database connection not configured')
  }

  checklist.push({
    item: 'Authentication configured',
    status: config.authentication.secret && config.authentication.url ? 'pass' : 'fail'
  })

  if (!config.authentication.secret || !config.authentication.url) {
    blockers.push('Authentication not properly configured')
  }

  checklist.push({
    item: 'File storage configured',
    status: config.storage.blobToken ? 'pass' : 'fail'
  })

  if (!config.storage.blobToken) {
    blockers.push('File storage not configured')
  }

  checklist.push({
    item: 'HTTPS enforced',
    status: config.security.httpsOnly ? 'pass' : 'warning'
  })

  if (!config.security.httpsOnly) {
    warnings.push('HTTPS should be enforced in production')
  }

  checklist.push({
    item: 'Security headers enabled',
    status: config.security.contentSecurityPolicy && config.security.xssProtection ? 'pass' : 'warning'
  })

  if (!config.security.contentSecurityPolicy || !config.security.xssProtection) {
    warnings.push('Security headers should be enabled')
  }

  checklist.push({
    item: 'Error tracking configured',
    status: config.monitoring.errorTracking ? 'pass' : 'warning'
  })

  if (!config.monitoring.errorTracking) {
    warnings.push('Error tracking recommended for production')
  }

  checklist.push({
    item: 'Real-time features configured',
    status: config.realtime.enabled && config.realtime.key ? 'pass' : 'warning'
  })

  if (config.realtime.enabled && !config.realtime.key) {
    warnings.push('Real-time features enabled but not properly configured')
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    checklist
  }
}

// Generate deployment checklist
export function generateDeploymentChecklist(): Array<{
  category: string
  items: Array<{ task: string; completed: boolean; critical: boolean }>
}> {
  const config = getProductionConfig()

  return [
    {
      category: 'Environment Configuration',
      items: [
        { task: 'Set DATABASE_URL', completed: !!config.database.url, critical: true },
        { task: 'Set NEXTAUTH_SECRET', completed: !!config.authentication.secret, critical: true },
        { task: 'Set NEXTAUTH_URL', completed: !!config.authentication.url, critical: true },
        { task: 'Set BLOB_READ_WRITE_TOKEN', completed: !!config.storage.blobToken, critical: true },
        { task: 'Configure Pusher (optional)', completed: !!config.realtime.key, critical: false },
        { task: 'Set NODE_ENV=production', completed: process.env.NODE_ENV === 'production', critical: true }
      ]
    },
    {
      category: 'Security',
      items: [
        { task: 'Enable HTTPS', completed: config.security.httpsOnly, critical: true },
        { task: 'Configure CORS origins', completed: config.security.corsOrigins.length > 0, critical: false },
        { task: 'Enable security headers', completed: config.security.contentSecurityPolicy, critical: true },
        { task: 'Enable rate limiting', completed: config.security.rateLimiting, critical: true },
        { task: 'Review authentication settings', completed: config.authentication.csrfProtection, critical: true }
      ]
    },
    {
      category: 'Database',
      items: [
        { task: 'Run database migrations', completed: false, critical: true }, // This would need to be checked externally
        { task: 'Enable SSL connection', completed: config.database.ssl, critical: true },
        { task: 'Configure connection pooling', completed: config.database.poolSize > 0, critical: false },
        { task: 'Set up database backups', completed: config.database.backupEnabled, critical: false }
      ]
    },
    {
      category: 'Performance',
      items: [
        { task: 'Enable compression', completed: config.performance.compression, critical: false },
        { task: 'Enable caching', completed: config.performance.caching, critical: false },
        { task: 'Optimize images', completed: config.performance.imageOptimization, critical: false },
        { task: 'Configure CDN', completed: config.storage.cdnEnabled, critical: false }
      ]
    },
    {
      category: 'Monitoring',
      items: [
        { task: 'Set up error tracking', completed: config.monitoring.errorTracking, critical: false },
        { task: 'Enable performance monitoring', completed: config.monitoring.performanceMonitoring, critical: false },
        { task: 'Configure uptime monitoring', completed: config.monitoring.uptime, critical: false },
        { task: 'Set up logging', completed: config.monitoring.logging, critical: false }
      ]
    },
    {
      category: 'Testing',
      items: [
        { task: 'Run build successfully', completed: false, critical: true }, // This would need to be checked externally
        { task: 'Test authentication flow', completed: false, critical: true },
        { task: 'Test file uploads', completed: false, critical: true },
        { task: 'Test real-time features', completed: false, critical: false },
        { task: 'Test guest access', completed: false, critical: false }
      ]
    }
  ]
}

// Environment-specific configuration
export function getEnvironmentConfig(environment: 'development' | 'staging' | 'production') {
  const baseConfig = getProductionConfig()

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          httpsOnly: false,
          corsOrigins: ['http://localhost:3000']
        },
        monitoring: {
          ...baseConfig.monitoring,
          errorTracking: false,
          performanceMonitoring: false
        }
      }

    case 'staging':
      return {
        ...baseConfig,
        features: {
          ...baseConfig.features,
          betaFeatures: true
        },
        monitoring: {
          ...baseConfig.monitoring,
          errorTracking: true,
          performanceMonitoring: true
        }
      }

    case 'production':
    default:
      return {
        ...baseConfig,
        features: {
          ...baseConfig.features,
          betaFeatures: false
        }
      }
  }
}