import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { RealtimeService, ReplyEvent } from '@/lib/realtime'

const createReplySchema = z.object({
  content: z.string().min(1),
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

    const { id: annotationId } = await params

    // Verify user has access to this annotation
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        asset: {
          project: {
            ownerId: session.user.id,
          },
        },
      },
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    const replies = await prisma.reply.findMany({
      where: {
        annotationId,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(replies)
  } catch (error) {
    console.error('Error fetching replies:', error)
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

    const { id: annotationId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = createReplySchema.parse(body)

    // Verify user has access to this annotation
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        asset: {
          project: {
            ownerId: session.user.id,
          },
        },
      },
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    const reply = await prisma.reply.create({
      data: {
        annotationId,
        authorId: session.user.id,
        content: validatedData.content,
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
      },
    })

    // Broadcast real-time event
    await RealtimeService.broadcastReplyCreated(annotation.assetId, {
      ...reply,
      annotationId,
      createdAt: reply.createdAt.toISOString(),
    } as ReplyEvent)

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}