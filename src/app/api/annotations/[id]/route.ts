import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAnnotationSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'RESOLVED']).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
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

    const annotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        asset: {
          project: {
            ownerId: session.user.id,
          },
        },
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
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json(annotation)
  } catch (error) {
    console.error('Error fetching annotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const validatedData = updateAnnotationSchema.parse(body)

    // Verify user has access to this annotation
    const existingAnnotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        asset: {
          project: {
            ownerId: session.user.id,
          },
        },
      },
    })

    if (!existingAnnotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    const annotation = await prisma.annotation.update({
      where: {
        id: annotationId,
      },
      data: validatedData,
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
    })

    return NextResponse.json(annotation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating annotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const existingAnnotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        asset: {
          project: {
            ownerId: session.user.id,
          },
        },
      },
    })

    if (!existingAnnotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    await prisma.annotation.delete({
      where: {
        id: annotationId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}