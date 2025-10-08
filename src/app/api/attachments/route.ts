import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAttachmentSchema = z.object({
  filename: z.string(),
  url: z.string().url(),
  mimeType: z.string(),
  size: z.number(),
  annotationId: z.string().optional(),
  replyId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAttachmentSchema.parse(body)

    // Verify user has access to the annotation or reply
    if (validatedData.annotationId) {
      const annotation = await prisma.annotation.findFirst({
        where: {
          id: validatedData.annotationId,
          OR: [
            { authorId: session.user.id },
            {
              asset: {
                project: {
                  ownerId: session.user.id
                }
              }
            }
          ]
        }
      })

      if (!annotation) {
        return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
      }
    }

    if (validatedData.replyId) {
      const reply = await prisma.reply.findFirst({
        where: {
          id: validatedData.replyId,
          OR: [
            { authorId: session.user.id },
            {
              annotation: {
                asset: {
                  project: {
                    ownerId: session.user.id
                  }
                }
              }
            }
          ]
        }
      })

      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
      }
    }

    const attachment = await prisma.attachment.create({
      data: validatedData
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}