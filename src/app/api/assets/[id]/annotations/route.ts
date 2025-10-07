import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkAnnotationLimit } from '@/lib/subscription-limits'
import { RealtimeService, AnnotationEvent } from '@/lib/realtime'

const createAnnotationSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  content: z.string().min(1),
  type: z.enum(['COMMENT', 'RECTANGLE', 'ARROW', 'TEXT']),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assetId } = await params

    // Verify user has access to this asset through project ownership
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: {
          ownerId: session.user.id,
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const annotations = await prisma.annotation.findMany({
      where: {
        assetId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(annotations)
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assetId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = createAnnotationSchema.parse(body)

    // Verify user has access to this asset through project ownership
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: {
          ownerId: session.user.id,
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check annotation limit
    const limitCheck = await checkAnnotationLimit(session.user.id, asset.projectId);
    if (!limitCheck.canCreate) {
      return NextResponse.json(
        { 
          error: "Annotation limit reached",
          limit: limitCheck.limit,
          currentCount: limitCheck.currentCount,
          plan: limitCheck.plan,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const annotation = await prisma.annotation.create({
      data: {
        assetId,
        authorId: session.user.id,
        position: validatedData.position,
        content: validatedData.content,
        type: validatedData.type,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    // Broadcast real-time event
    await RealtimeService.broadcastAnnotationCreated(assetId, {
      ...annotation,
      assetId,
      authorId: session.user.id,
      createdAt: annotation.createdAt.toISOString(),
      updatedAt: annotation.updatedAt.toISOString(),
      position: annotation.position as { x: number; y: number; width?: number; height?: number },
    } as AnnotationEvent)

    return NextResponse.json(annotation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating annotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}