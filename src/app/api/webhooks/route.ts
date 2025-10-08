import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'annotation.created',
    'annotation.updated', 
    'annotation.resolved',
    'annotation.deleted',
    'reply.created',
    'mention.created'
  ])),
  secret: z.string().optional(),
  active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // For now, return empty array as webhooks aren't implemented in the schema
    // In a real implementation, you'd have a Webhook model
    return NextResponse.json({ webhooks: [] })

  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, events, secret, active } = webhookSchema.parse(body)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // For now, just return success as webhooks aren't implemented in the schema
    // In a real implementation, you'd create a webhook record
    const webhook = {
      id: `webhook_${Date.now()}`,
      projectId,
      url,
      events,
      secret: secret ? '***hidden***' : null,
      active,
      createdAt: new Date().toISOString()
    }

    console.log('Webhook created (mock):', webhook)

    return NextResponse.json(webhook, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Webhook delivery function (would be called when events occur)
export async function deliverWebhook(
  webhookUrl: string,
  event: string,
  payload: any,
  secret?: string
) {
  try {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'PixelPin-Webhooks/1.0'
    }

    // Add signature if secret is provided
    if (secret) {
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
      headers['X-PixelPin-Signature'] = `sha256=${signature}`
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Webhook delivery error:', error)
    return false
  }
}