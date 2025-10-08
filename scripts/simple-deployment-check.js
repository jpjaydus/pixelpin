#!/usr/bin/env node

/**
 * Simple Deployment Readiness Check
 * 
 * This script performs basic checks to validate deployment readiness
 * without relying on complex TypeScript files that may have compilation issues.
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

async function checkEnvironmentVariables() {
  logSection('Environment Variables Check')
  
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
  
  let score = 100
  let allRequired = true
  
  log('\nRequired Environment Variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      log(`✅ ${varName}: Set`, 'green')
    } else {
      log(`❌ ${varName}: Missing`, 'red')
      allRequired = false
      score -= 25
    }
  })
  
  log('\nOptional Environment Variables:')
  let optionalCount = 0
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      log(`✅ ${varName}: Set`, 'green')
      optionalCount++
    } else {
      log(`⚠️  ${varName}: Not set (real-time features will be disabled)`, 'yellow')
    }
  })
  
  if (optionalCount === 0) {
    score -= 10
  }
  
  return { success: allRequired, score, details: `${requiredVars.filter(v => process.env[v]).length}/${requiredVars.length} required variables set` }
}

async function checkBuildConfiguration() {
  logSection('Build Configuration Check')
  
  let score = 100
  const issues = []
  
  // Check package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    log('✅ package.json exists', 'green')
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'dev']
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`✅ Script "${script}" defined`, 'green')
      } else {
        log(`❌ Script "${script}" missing`, 'red')
        issues.push(`Missing ${script} script`)
        score -= 15
      }
    })
    
    // Check dependencies
    const criticalDeps = ['next', 'react', 'prisma', '@prisma/client']
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log(`✅ Dependency "${dep}" installed`, 'green')
      } else {
        log(`❌ Dependency "${dep}" missing`, 'red')
        issues.push(`Missing ${dep} dependency`)
        score -= 20
      }
    })
  } else {
    log('❌ package.json not found', 'red')
    issues.push('package.json not found')
    score -= 50
  }
  
  // Check Next.js config
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js')
  if (fs.existsSync(nextConfigPath)) {
    log('✅ next.config.js exists', 'green')
  } else {
    log('⚠️  next.config.js not found', 'yellow')
    score -= 5
  }
  
  // Check Prisma schema
  const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
  if (fs.existsSync(prismaSchemaPath)) {
    log('✅ Prisma schema exists', 'green')
  } else {
    log('❌ Prisma schema not found', 'red')
    issues.push('Prisma schema missing')
    score -= 25
  }
  
  return { success: issues.length === 0, score, issues }
}

async function checkSecurityConfiguration() {
  logSection('Security Configuration Check')
  
  let score = 100
  const issues = []
  
  // Check environment-based security settings
  const securityChecks = [
    {
      name: 'NODE_ENV set to production',
      check: () => process.env.NODE_ENV === 'production',
      required: false,
      points: 10
    },
    {
      name: 'NEXTAUTH_SECRET is strong',
      check: () => {
        const secret = process.env.NEXTAUTH_SECRET
        return secret && secret.length >= 32 && secret !== 'your-secret-key'
      },
      required: true,
      points: 25
    },
    {
      name: 'NEXTAUTH_URL uses HTTPS',
      check: () => {
        const url = process.env.NEXTAUTH_URL
        return !url || url.startsWith('https://') || process.env.NODE_ENV !== 'production'
      },
      required: true,
      points: 20
    },
    {
      name: 'Database URL uses SSL',
      check: () => {
        const dbUrl = process.env.DATABASE_URL
        return !dbUrl || dbUrl.includes('ssl=true') || dbUrl.includes('sslmode=require') || process.env.NODE_ENV !== 'production'
      },
      required: false,
      points: 15
    }
  ]
  
  securityChecks.forEach(({ name, check, required, points }) => {
    const passed = check()
    if (passed) {
      log(`✅ ${name}`, 'green')
    } else {
      const level = required ? 'red' : 'yellow'
      const symbol = required ? '❌' : '⚠️ '
      log(`${symbol} ${name}`, level)
      
      if (required) {
        issues.push(name)
      }
      score -= points
    }
  })
  
  return { success: issues.length === 0, score, issues }
}

async function checkFileStructure() {
  logSection('File Structure Check')
  
  let score = 100
  const issues = []
  
  const requiredPaths = [
    { path: 'src/app', name: 'Next.js app directory', points: 25 },
    { path: 'src/components', name: 'Components directory', points: 15 },
    { path: 'src/lib', name: 'Library directory', points: 10 },
    { path: 'prisma', name: 'Prisma directory', points: 20 },
    { path: 'public', name: 'Public assets directory', points: 5 },
    { path: '.env.example', name: 'Environment example file', points: 5 }
  ]
  
  requiredPaths.forEach(({ path: filePath, name, points }) => {
    const fullPath = path.join(__dirname, '..', filePath)
    if (fs.existsSync(fullPath)) {
      log(`✅ ${name} exists`, 'green')
    } else {
      log(`❌ ${name} missing`, 'red')
      issues.push(`Missing ${name}`)
      score -= points
    }
  })
  
  return { success: issues.length === 0, score, issues }
}

async function runQuickBuildTest() {
  logSection('Quick Build Test')
  
  try {
    log('🔄 Running production build test...', 'yellow')
    
    // Run build with timeout
    const buildCommand = 'npm run build'
    const startTime = Date.now()
    
    execSync(buildCommand, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000, // 5 minutes timeout
      cwd: path.join(__dirname, '..')
    })
    
    const buildTime = Date.now() - startTime
    log(`✅ Build completed successfully in ${Math.round(buildTime / 1000)}s`, 'green')
    
    // Check if .next directory was created
    const nextDir = path.join(__dirname, '..', '.next')
    if (fs.existsSync(nextDir)) {
      log('✅ .next directory created', 'green')
      return { success: true, score: 100, buildTime }
    } else {
      log('❌ .next directory not found after build', 'red')
      return { success: false, score: 50, error: '.next directory missing' }
    }
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, 'red')
    return { success: false, score: 0, error: error.message }
  }
}

async function generateSimpleReport(results) {
  logSection('Generating Deployment Report')
  
  const timestamp = new Date().toISOString()
  const overallScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
  const allPassed = results.every(r => r.success)
  
  const reportContent = `# PixelPin Simple Deployment Readiness Report

Generated: ${timestamp}
Environment: ${process.env.NODE_ENV || 'development'}
Overall Score: ${overallScore}%
Status: ${allPassed ? '✅ READY' : '❌ NOT READY'}

## Test Results Summary

${results.map(result => `
### ${result.name}
- **Score:** ${result.score}%
- **Status:** ${result.success ? '✅ PASS' : '❌ FAIL'}
${result.issues ? `- **Issues:** ${result.issues.join(', ')}` : ''}
${result.details ? `- **Details:** ${result.details}` : ''}
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('')}

## Summary

- **Tests Passed:** ${results.filter(r => r.success).length}/${results.length}
- **Overall Score:** ${overallScore}%
- **Ready for Production:** ${allPassed ? 'YES' : 'NO'}

## Next Steps

${allPassed 
  ? `🚀 **Ready for Deployment!**
1. Run comprehensive testing if needed
2. Deploy to staging environment
3. Perform final smoke tests
4. Deploy to production`
  : `⚠️ **Issues Found - Address Before Deployment:**
${results.filter(r => !r.success).map(r => `- Fix ${r.name.toLowerCase()}`).join('\n')}

After fixing issues:
1. Re-run this deployment check
2. Run comprehensive testing
3. Deploy to staging for validation`
}

## Configuration Checklist

- [ ] All required environment variables set
- [ ] Database connection configured
- [ ] Authentication properly set up
- [ ] File storage configured
- [ ] Security headers enabled
- [ ] HTTPS enforced (production)
- [ ] Build process working
- [ ] Dependencies installed

---
*Generated by PixelPin Simple Deployment Check*
`
  
  const reportPath = path.join(__dirname, '..', `simple-deployment-report-${new Date().toISOString().split('T')[0]}.md`)
  fs.writeFileSync(reportPath, reportContent)
  
  log(`📄 Report saved to: ${reportPath}`, 'cyan')
  
  return { overallScore, allPassed, reportPath }
}

async function main() {
  log('🚀 PixelPin Simple Deployment Readiness Check', 'bright')
  log('Running basic checks to validate deployment readiness\n', 'cyan')
  
  const results = []
  
  try {
    // 1. Environment Variables
    const envCheck = await checkEnvironmentVariables()
    results.push({
      name: 'Environment Variables',
      success: envCheck.success,
      score: envCheck.score,
      details: envCheck.details
    })
    
    // 2. Build Configuration
    const buildConfigCheck = await checkBuildConfiguration()
    results.push({
      name: 'Build Configuration',
      success: buildConfigCheck.success,
      score: buildConfigCheck.score,
      issues: buildConfigCheck.issues
    })
    
    // 3. Security Configuration
    const securityCheck = await checkSecurityConfiguration()
    results.push({
      name: 'Security Configuration',
      success: securityCheck.success,
      score: securityCheck.score,
      issues: securityCheck.issues
    })
    
    // 4. File Structure
    const fileStructureCheck = await checkFileStructure()
    results.push({
      name: 'File Structure',
      success: fileStructureCheck.success,
      score: fileStructureCheck.score,
      issues: fileStructureCheck.issues
    })
    
    // 5. Build Test (only if other checks pass)
    if (results.every(r => r.success)) {
      const buildTest = await runQuickBuildTest()
      results.push({
        name: 'Build Test',
        success: buildTest.success,
        score: buildTest.score,
        error: buildTest.error,
        details: buildTest.buildTime ? `Build time: ${Math.round(buildTest.buildTime / 1000)}s` : undefined
      })
    } else {
      log('\n⚠️  Skipping build test due to configuration issues', 'yellow')
      results.push({
        name: 'Build Test',
        success: false,
        score: 0,
        error: 'Skipped due to configuration issues'
      })
    }
    
    // Generate report
    const { overallScore, allPassed } = await generateSimpleReport(results)
    
    // Final summary
    logSection('Final Summary')
    
    const passedTests = results.filter(r => r.success).length
    const totalTests = results.length
    
    log(`\n📊 Tests Passed: ${passedTests}/${totalTests}`, 'bright')
    log(`📈 Overall Score: ${overallScore}%`, 'bright')
    
    if (allPassed) {
      log('\n🎉 All basic checks passed! Ready for deployment preparation!', 'green')
      log('\nNext steps:', 'cyan')
      log('1. Run comprehensive testing: npm run test:deployment', 'cyan')
      log('2. Perform manual testing of key features', 'cyan')
      log('3. Deploy to staging environment', 'cyan')
      process.exit(0)
    } else {
      log(`\n⚠️  ${totalTests - passedTests} check(s) failed. Address issues before deployment.`, 'yellow')
      log('\nFailed checks:', 'red')
      results.filter(r => !r.success).forEach(r => {
        log(`- ${r.name}`, 'red')
      })
      process.exit(1)
    }
    
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n🛑 Check interrupted by user', 'yellow')
  process.exit(1)
})

// Run the main function
main().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red')
  process.exit(1)
})