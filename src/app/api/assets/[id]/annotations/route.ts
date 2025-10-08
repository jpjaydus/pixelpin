import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkAnnotationLimit } from '@/lib/subscription-limits'
import { RealtimeService, AnnotationEvent } from '@/lib/realtime'

// CSV export utility
function generateAnnotationCSV(annotations: Array<Record<string, unknown>>, asset: { id: string; name: string }): string {
  const headers = [
    'ID',
    'Content',
    'Status',
    'Author',
    'Author Email',
    'Guest Name',
    'Guest Email',
    'Page URL',
    'Position X',
    'Position Y',
    'Created At',
    'Updated At',
    'Replies Count',
    'Attachments Count'
  ]

  const rows = annotations.map(annotation => [
    annotation.id,
    `"${String(annotation.content || '').replace(/"/g, '""')}"`,
    annotation.status,
    (annotation.author as { name?: string } | null)?.name || '',
    (annotation.author as { email?: string } | null)?.email || '',
    annotation.guestName || '',
    annotation.guestEmail || '',
    annotation.pageUrl,
    (annotation.position as { x: number })?.x || 0,
    (annotation.position as { y: number })?.y || 0,
    annotation.createdAt,
    annotation.updatedAt,
    (annotation.replies as unknown[] | undefined)?.length || 0,
    (annotation.attachments as unknown[] | undefined)?.length || 0
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

const createAnnotationSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  content: z.string(),
  screenshot: z.string().url(),
  pageUrl: z.string().url(),
  metadata: z.object({
    browserName: z.string(),
    browserVersion: z.string(),
    operatingSystem: z.string(),
    viewportSize: z.object({
      width: z.number(),
      height: z.number(),
    }),
    userAgent: z.string(),
    timestamp: z.string(),
  }),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string().url(),
    fileType: z.string(),
    fileSize: z.number(),
  })).optional(),
  // Guest annotation support
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestToken: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const guestToken = searchParams.get('guestToken')
    const pageUrl = searchParams.get('pageUrl')
    const status = searchParams.get('status') as 'OPEN' | 'RESOLVED' | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const format = searchParams.get('format') // for export functionality

    let asset

    if (guestToken) {
      // Guest access
      asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
          project: {
            shareToken: guestToken,
            guestAccessEnabled: true,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              guestAccessEnabled: true,
            }
          }
        }
      })
    } else {
      // Authenticated user access
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      asset = await prisma.asset.findFirst({
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
        include: {
          project: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            }
          }
        }
      })
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Build where clause for filtering
    const whereClause: { assetId: string; pageUrl?: string; status?: 'OPEN' | 'RESOLVED' } = { assetId }
    
    if (pageUrl) {
      whereClause.pageUrl = pageUrl
    }
    
    if (status) {
      whereClause.status = status
    }

    const annotations = await prisma.annotation.findMany({
      where: whereClause,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Handle export format
    if (format === 'json') {
      return NextResponse.json({
        annotations,
        meta: {
          total: await prisma.annotation.count({ where: whereClause }),
          limit,
          offset,
          asset: {
            id: asset.id,
            name: asset.name,
            project: asset.project
          }
        }
      })
    }

    if (format === 'csv') {
      const csv = generateAnnotationCSV(annotations, asset)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="annotations-${asset.name}.csv"`
        }
      })
    }

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
    const { id: assetId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = createAnnotationSchema.parse(body)

    let asset
    let authorId: string | null = null

    if (validatedData.guestToken) {
      // Guest annotation
      asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
          project: {
            shareToken: validatedData.guestToken,
            guestAccessEnabled: true,
          },
        },
      })

      if (!validatedData.guestName) {
        return NextResponse.json({ error: 'Guest name is required' }, { status: 400 })
      }
    } else {
      // Authenticated user annotation
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      authorId = session.user.id

      asset = await prisma.asset.findFirst({
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

      // Check annotation limit for authenticated users
      if (asset) {
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
      }
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const annotation = await prisma.annotation.create({
      data: {
        assetId,
        authorId,
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        position: validatedData.position,
        content: validatedData.content,
        screenshot: validatedData.screenshot,
        pageUrl: validatedData.pageUrl,
        metadata: validatedData.metadata,
        attachments: validatedData.attachments ? {
          create: validatedData.attachments.map(att => ({
            filename: att.filename,
            url: att.url,
            mimeType: att.fileType,
            size: att.fileSize,
          }))
        } : undefined,
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

    // Broadcast real-time event
    await RealtimeService.broadcastAnnotationCreated(assetId, {
      ...annotation,
      assetId,
      authorId: authorId || 'guest',
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