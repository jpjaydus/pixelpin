import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the attachment and verify user has permission to delete it
    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        OR: [
          // User owns the annotation
          {
            annotation: {
              authorId: session.user.id
            }
          },
          // User owns the reply
          {
            reply: {
              authorId: session.user.id
            }
          },
          // User owns the project
          {
            annotation: {
              asset: {
                project: {
                  ownerId: session.user.id
                }
              }
            }
          },
          // User owns the project (through reply)
          {
            reply: {
              annotation: {
                asset: {
                  project: {
                    ownerId: session.user.id
                  }
                }
              }
            }
          }
        ]
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(attachment.url)
    } catch (blobError) {
      console.warn('Failed to delete blob:', blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        OR: [
          // User has access through annotation
          {
            annotation: {
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
          },
          // User has access through reply
          {
            reply: {
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
          }
        ]
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Error fetching attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}