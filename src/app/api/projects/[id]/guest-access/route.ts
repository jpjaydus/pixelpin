import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGuestAccessSchema = z.object({
  guestAccessEnabled: z.boolean(),
  shareToken: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id
      },
      select: {
        id: true,
        name: true,
        guestAccessEnabled: true,
        shareToken: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to get guest access settings:', error)
    return NextResponse.json(
      { error: 'Failed to get guest access settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { guestAccessEnabled, shareToken } = updateGuestAccessSchema.parse(body)

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Generate share token if enabling guest access and no token exists
    let finalShareToken = shareToken
    if (guestAccessEnabled && !finalShareToken) {
      finalShareToken = generateShareToken()
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        guestAccessEnabled,
        shareToken: guestAccessEnabled ? finalShareToken : null
      },
      select: {
        id: true,
        name: true,
        guestAccessEnabled: true,
        shareToken: true
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to update guest access:', error)
    return NextResponse.json(
      { error: 'Failed to update guest access' },
      { status: 500 }
    )
  }
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}