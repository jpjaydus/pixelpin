export interface BrowserMetadata {
  browserName: string
  browserVersion: string
  operatingSystem: string
  viewportSize: {
    width: number
    height: number
  }
  userAgent: string
  timestamp: string
}

/**
 * Detect browser name from user agent
 */
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari'
  } else if (userAgent.includes('Edg')) {
    return 'Edge'
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'Opera'
  } else {
    return 'Unknown'
  }
}

/**
 * Extract browser version from user agent
 */
function getBrowserVersion(userAgent: string, browserName: string): string {
  let version = 'Unknown'
  
  try {
    switch (browserName) {
      case 'Chrome':
        const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/)
        version = chromeMatch ? chromeMatch[1] : 'Unknown'
        break
      case 'Firefox':
        const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/)
        version = firefoxMatch ? firefoxMatch[1] : 'Unknown'
        break
      case 'Safari':
        const safariMatch = userAgent.match(/Version\/([0-9.]+)/)
        version = safariMatch ? safariMatch[1] : 'Unknown'
        break
      case 'Edge':
        const edgeMatch = userAgent.match(/Edg\/([0-9.]+)/)
        version = edgeMatch ? edgeMatch[1] : 'Unknown'
        break
      case 'Opera':
        const operaMatch = userAgent.match(/(Opera|OPR)\/([0-9.]+)/)
        version = operaMatch ? operaMatch[2] : 'Unknown'
        break
    }
  } catch (error) {
    console.warn('Error extracting browser version:', error)
  }
  
  return version
}

/**
 * Detect operating system from user agent
 */
function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows NT 10.0')) {
    return 'Windows 10'
  } else if (userAgent.includes('Windows NT 6.3')) {
    return 'Windows 8.1'
  } else if (userAgent.includes('Windows NT 6.2')) {
    return 'Windows 8'
  } else if (userAgent.includes('Windows NT 6.1')) {
    return 'Windows 7'
  } else if (userAgent.includes('Windows')) {
    return 'Windows'
  } else if (userAgent.includes('Mac OS X')) {
    const macMatch = userAgent.match(/Mac OS X ([0-9_]+)/)
    if (macMatch) {
      const version = macMatch[1].replace(/_/g, '.')
      return `macOS ${version}`
    }
    return 'macOS'
  } else if (userAgent.includes('Linux')) {
    return 'Linux'
  } else if (userAgent.includes('Android')) {
    const androidMatch = userAgent.match(/Android ([0-9.]+)/)
    return androidMatch ? `Android ${androidMatch[1]}` : 'Android'
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const iosMatch = userAgent.match(/OS ([0-9_]+)/)
    if (iosMatch) {
      const version = iosMatch[1].replace(/_/g, '.')
      return `iOS ${version}`
    }
    return 'iOS'
  } else {
    return 'Unknown'
  }
}

/**
 * Get current viewport size
 */
function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth || document.documentElement.clientWidth || 0,
    height: window.innerHeight || document.documentElement.clientHeight || 0
  }
}

/**
 * Collect comprehensive browser metadata
 */
export function collectBrowserMetadata(): BrowserMetadata {
  const userAgent = navigator.userAgent
  const browserName = getBrowserName(userAgent)
  const browserVersion = getBrowserVersion(userAgent, browserName)
  const operatingSystem = getOperatingSystem(userAgent)
  const viewportSize = getViewportSize()

  return {
    browserName,
    browserVersion,
    operatingSystem,
    viewportSize,
    userAgent,
    timestamp: new Date().toISOString()
  }
}

/**
 * Validate and sanitize browser metadata
 */
export function sanitizeBrowserMetadata(metadata: Partial<BrowserMetadata>): BrowserMetadata {
  return {
    browserName: typeof metadata.browserName === 'string' ? metadata.browserName : 'Unknown',
    browserVersion: typeof metadata.browserVersion === 'string' ? metadata.browserVersion : 'Unknown',
    operatingSystem: typeof metadata.operatingSystem === 'string' ? metadata.operatingSystem : 'Unknown',
    viewportSize: {
      width: typeof metadata.viewportSize?.width === 'number' ? metadata.viewportSize.width : 0,
      height: typeof metadata.viewportSize?.height === 'number' ? metadata.viewportSize.height : 0
    },
    userAgent: typeof metadata.userAgent === 'string' ? metadata.userAgent : '',
    timestamp: typeof metadata.timestamp === 'string' ? metadata.timestamp : new Date().toISOString()
  }
}

/**
 * Format browser metadata for display
 */
export function formatBrowserMetadata(metadata: BrowserMetadata): string {
  return `${metadata.browserName} ${metadata.browserVersion} on ${metadata.operatingSystem} (${metadata.viewportSize.width}x${metadata.viewportSize.height})`
}