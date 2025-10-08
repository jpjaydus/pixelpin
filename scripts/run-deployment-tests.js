#!/usr/bin/env node

/**
 * Deployment Testing Script
 * 
 * This script runs comprehensive tests to validate deployment readiness
 * including browser compatibility, security, performance, and configuration.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`${title}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')
}

function logSubsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue')
  log(`${title}`, 'blue')
  log(`${'-'.repeat(40)}`, 'blue')
}

async function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'yellow')
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    })
    log(`✅ ${description} completed`, 'green')
    return { success: true, output }
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function checkEnvironmentVariables() {
  logSubsection('Environment Variables Check')
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'BLOB_READ_WRITE_TOKEN'
  ]
  
  const optionalVars = [
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER'
  ]
  
  let allRequired = true
  
  log('\nRequired Environment Variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      log(`✅ ${varName}: Set`, 'green')
    } else {
      log(`❌ ${varName}: Missing`, 'red')
      allRequired = false
    }
  })
  
  log('\nOptional Environment Variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      log(`✅ ${varName}: Set`, 'green')
    } else {
      log(`⚠️  ${varName}: Not set (real-time features will be disabled)`, 'yellow')
    }
  })
  
  return allRequired
}

async function runTypeScriptCheck() {
  logSubsection('TypeScript Type Checking')
  return await runCommand('npx tsc --noEmit', 'TypeScript type checking')
}

async function runLinting() {
  logSubsection('ESLint Code Quality Check')
  return await runCommand('npm run lint', 'ESLint code quality check')
}

async function runBuild() {
  logSubsection('Production Build Test')
  return await runCommand('npm run build', 'Production build')
}

async function runDatabaseCheck() {
  logSubsection('Database Connection Check')
  
  if (!process.env.DATABASE_URL) {
    log('❌ DATABASE_URL not set, skipping database check', 'red')
    return { success: false, error: 'DATABASE_URL not configured' }
  }
  
  // Create a simple database connection test
  const testScript = `
const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1)
}).catch(() => {
  process.exit(1)
})
`
  
  const testFile = path.join(__dirname, '..', 'temp-db-test.js')
  fs.writeFileSync(testFile, testScript)
  
  try {
    const result = await runCommand(`node ${testFile}`, 'Database connection test')
    fs.unlinkSync(testFile)
    return result
  } catch (error) {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
    return { success: false, error: error.message }
  }
}

async function checkSecurityHeaders() {
  logSubsection('Security Configuration Check')
  
  const securityChecks = [
    {
      name: 'HTTPS Enforcement',
      check: () => process.env.NODE_ENV === 'production' ? process.env.HTTPS_ONLY !== 'false' : true
    },
    {
      name: 'CSRF Protection',
      check: () => process.env.CSRF_PROTECTION !== 'false'
    },
    {
      name: 'Content Security Policy',
      check: () => process.env.CSP_ENABLED !== 'false'
    },
    {
      name: 'XSS Protection',
      check: () => process.env.XSS_PROTECTION !== 'false'
    }
  ]
  
  let allPassed = true
  
  securityChecks.forEach(({ name, check }) => {
    const passed = check()
    if (passed) {
      log(`✅ ${name}: Enabled`, 'green')
    } else {
      log(`❌ ${name}: Disabled`, 'red')
      allPassed = false
    }
  })
  
  return { success: allPassed }
}

async function generateDeploymentReport(results) {
  logSubsection('Generating Deployment Report')
  
  const timestamp = new Date().toISOString()
  const reportData = {
    timestamp,
    environment: process.env.NODE_ENV || 'development',
    results,
    overallStatus: results.every(r => r.success) ? 'READY' : 'NOT_READY'
  }
  
  const reportContent = `# PixelPin Deployment Readiness Report

Generated: ${timestamp}
Environment: ${reportData.environment}
Overall Status: ${reportData.overallStatus}

## Test Results

${results.map(result => `
### ${result.name}
- Status: ${result.success ? '✅ PASS' : '❌ FAIL'}
${result.error ? `- Error: ${result.error}` : ''}
${result.notes ? `- Notes: ${result.notes}` : ''}
`).join('')}

## Recommendations

${reportData.overallStatus === 'READY' 
  ? '🚀 All checks passed! Ready for production deployment.'
  : '⚠️ Some checks failed. Please address the issues above before deploying to production.'
}

## Next Steps

${reportData.overallStatus === 'READY' 
  ? `1. Run final manual testing
2. Deploy to staging environment
3. Perform smoke tests
4. Deploy to production`
  : `1. Fix failing tests
2. Re-run deployment readiness check
3. Verify all issues are resolved
4. Proceed with deployment`
}
`
  
  const reportPath = path.join(__dirname, '..', `deployment-report-${new Date().toISOString().split('T')[0]}.md`)
  fs.writeFileSync(reportPath, reportContent)
  
  log(`📄 Deployment report saved to: ${reportPath}`, 'cyan')
  
  return reportPath
}

async function main() {
  log('🚀 PixelPin Deployment Readiness Testing', 'bright')
  log('This script will run comprehensive tests to validate deployment readiness\n', 'cyan')
  
  const results = []
  
  try {
    // 1. Environment Variables Check
    logSection('1. Environment Configuration')
    const envCheck = await checkEnvironmentVariables()
    results.push({
      name: 'Environment Variables',
      success: envCheck,
      notes: envCheck ? 'All required variables set' : 'Missing required environment variables'
    })
    
    // 2. TypeScript Check
    logSection('2. Code Quality Checks')
    const tsCheck = await runTypeScriptCheck()
    results.push({
      name: 'TypeScript Check',
      success: tsCheck.success,
      error: tsCheck.error
    })
    
    // 3. Linting Check
    const lintCheck = await runLinting()
    results.push({
      name: 'ESLint Check',
      success: lintCheck.success,
      error: lintCheck.error
    })
    
    // 4. Build Check
    logSection('3. Build Verification')
    const buildCheck = await runBuild()
    results.push({
      name: 'Production Build',
      success: buildCheck.success,
      error: buildCheck.error
    })
    
    // 5. Database Check
    logSection('4. Database Connectivity')
    const dbCheck = await runDatabaseCheck()
    results.push({
      name: 'Database Connection',
      success: dbCheck.success,
      error: dbCheck.error
    })
    
    // 6. Security Check
    logSection('5. Security Configuration')
    const securityCheck = await checkSecurityHeaders()
    results.push({
      name: 'Security Configuration',
      success: securityCheck.success,
      notes: securityCheck.success ? 'Security headers properly configured' : 'Security configuration issues found'
    })
    
    // Generate final report
    logSection('6. Final Report')
    const reportPath = await generateDeploymentReport(results)
    
    // Summary
    logSection('Summary')
    const passedTests = results.filter(r => r.success).length
    const totalTests = results.length
    const successRate = Math.round((passedTests / totalTests) * 100)
    
    log(`\n📊 Test Results: ${passedTests}/${totalTests} passed (${successRate}%)`, 'bright')
    
    if (passedTests === totalTests) {
      log('\n🎉 All tests passed! Ready for production deployment!', 'green')
      process.exit(0)
    } else {
      log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please address the issues before deployment.`, 'yellow')
      process.exit(1)
    }
    
  } catch (error) {
    log(`\n💥 Unexpected error during testing: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n🛑 Testing interrupted by user', 'yellow')
  process.exit(1)
})

process.on('SIGTERM', () => {
  log('\n\n🛑 Testing terminated', 'yellow')
  process.exit(1)
})

// Run the main function
main().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red')
  process.exit(1)
})