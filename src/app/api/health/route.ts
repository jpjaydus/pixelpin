import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHealthCheckData } from '@/lib/deployment'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Get health check data
    const healthData = getHealthCheckData()
    
    // Add database status
    const response = {
      ...healthData,
      database: {
        status: 'connected',
        timestamp: new Date().toISOString()
      },
      services: {
        database: 'healthy',
        blob_storage: process.env.BLOB_READ_WRITE_TOKEN ? 'configured' : 'not_configured',
        realtime: process.env.PUSHER_APP_ID ? 'configured' : 'not_configured',
        auth: 'healthy'
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        }
      },
      { status: 503 }
    )
  }
}