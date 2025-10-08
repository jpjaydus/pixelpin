import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { RealtimeService } from '@/lib/realtime'

const bulkUpdateSchema = z.object({
  annotationIds: z.array(z.string()),
  action: z.enum(['resolve', 'unresolve', 'delete']),
  status: z.enum(['OPEN', 'RESOLVED']).optional(),
})

export async function PATCH(
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
    const { annotationIds, action, status } = bulkUpdateSchema.parse(body)

    // Verify user has access to this asset
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: {
          OR: [
            { ownerId: session.user.id },
            { 
              collaborators: {
                some: { userId: session.user.id }
              }
            }
          ]
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Verify all annotations belong to this asset and user has permission
    const annotations = await prisma.annotation.findMany({
      where: {
        id: { in: annotationIds },
        assetId,
        OR: [
          { authorId: session.user.id }, // User owns the annotation
          { 
            asset: {
              project: {
                ownerId: session.user.id // User owns the project
              }
            }
          }
        ]
      }
    })

    if (annotations.length !== annotationIds.length) {
      return NextResponse.json({ 
        error: 'Some annotations not found or access denied' 
      }, { status: 403 })
    }

    let result

    if (action === 'delete') {
      // Delete annotations
      result = await prisma.annotation.deleteMany({
        where: {
          id: { in: annotationIds },
          assetId,
        }
      })

      // Broadcast deletion events
      for (const annotationId of annotationIds) {
        await RealtimeService.broadcastAnnotationDeleted(assetId, { id: annotationId })
      }

    } else {
      // Update status
      const newStatus = action === 'resolve' ? 'RESOLVED' : 'OPEN'
      
      result = await prisma.annotation.updateMany({
        where: {
          id: { in: annotationIds },
          assetId,
        },
        data: {
          status: status || newStatus,
          updatedAt: new Date(),
        }
      })

      // Broadcast update events
      const updatedAnnotations = await prisma.annotation.findMany({
        where: { id: { in: annotationIds } },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          attachments: true,
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
              attachments: true,
            },
          },
        },
      })

      for (const annotation of updatedAnnotations) {
        await RealtimeService.broadcastAnnotationUpdated(assetId, {
          ...annotation,
          assetId,
          authorId: annotation.authorId || 'guest',
          createdAt: annotation.createdAt.toISOString(),
          updatedAt: annotation.updatedAt.toISOString(),
          position: annotation.position as { x: number; y: number; width?: number; height?: number },
        })
      }
    }

    return NextResponse.json({
      success: true,
      action,
      affected: result.count,
      annotationIds
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in bulk annotation operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}