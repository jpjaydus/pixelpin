import { prisma } from '@/lib/prisma'

export interface MentionNotification {
  id: string
  userId: string
  annotationId?: string
  replyId?: string
  mentionedBy: {
    id: string
    name?: string | null
    email: string
  }
  content: string
  createdAt: Date
  read: boolean
}

export async function createMentions(
  userIds: string[],
  annotationId?: string,
  replyId?: string
) {
  if (userIds.length === 0) return []

  try {
    const mentions = await Promise.all(
      userIds.map(userId =>
        prisma.mention.create({
          data: {
            userId,
            annotationId,
            replyId
          }
        })
      )
    )

    // Send notifications (you can integrate with email service here)
    await sendMentionNotifications(userIds, annotationId, replyId)

    return mentions
  } catch (error) {
    console.error('Failed to create mentions:', error)
    throw error
  }
}

export async function sendMentionNotifications(
  userIds: string[],
  annotationId?: string,
  replyId?: string
) {
  try {
    // Get users and context
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } }
    })

    let context = null
    if (annotationId) {
      context = await prisma.annotation.findUnique({
        where: { id: annotationId },
        include: {
          asset: {
            include: {
              project: true
            }
          },
          author: true
        }
      })
    } else if (replyId) {
      context = await prisma.reply.findUnique({
        where: { id: replyId },
        include: {
          annotation: {
            include: {
              asset: {
                include: {
                  project: true
                }
              }
            }
          },
          author: true
        }
      })
    }

    // Here you would integrate with your notification service
    // For now, we'll just log the notifications
    for (const user of users) {
      console.log(`Mention notification for ${user.email}:`, {
        context,
        mentionedBy: context?.author || (context as any)?.annotation?.author
      })
      
      // TODO: Send email notification
      // await sendEmailNotification(user.email, {
      //   type: 'mention',
      //   context,
      //   mentionedBy: context?.author
      // })
    }
  } catch (error) {
    console.error('Failed to send mention notifications:', error)
  }
}

export async function getMentionsForUser(userId: string, limit = 20) {
  try {
    const mentions = await prisma.mention.findMany({
      where: { userId },
      include: {
        annotation: {
          include: {
            author: true,
            asset: {
              include: {
                project: true
              }
            }
          }
        },
        reply: {
          include: {
            author: true,
            annotation: {
              include: {
                asset: {
                  include: {
                    project: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return mentions.map(mention => ({
      id: mention.id,
      userId: mention.userId,
      annotationId: mention.annotationId,
      replyId: mention.replyId,
      mentionedBy: mention.annotation?.author || mention.reply?.author,
      content: mention.annotation?.content || mention.reply?.content || '',
      createdAt: mention.createdAt,
      read: false, // TODO: Add read status to schema
      project: mention.annotation?.asset.project || mention.reply?.annotation?.asset.project
    }))
  } catch (error) {
    console.error('Failed to get mentions:', error)
    return []
  }
}

export function extractMentionIds(text: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[2]) // User ID
  }

  return mentions
}

export function renderMentionsAsText(text: string): string {
  // Convert mention format back to readable text
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')
}

export function highlightMentions(text: string): string {
  // Convert mentions to HTML for display
  return text.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="bg-blue-100 text-blue-800 px-1 rounded">@$1</span>'
  )
}