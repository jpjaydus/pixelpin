import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCollaboratorSchema = z.object({
  role: z.enum(['OWNER', 'EDITOR']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, collaboratorId } = await params
    const body = await request.json()
    const { role } = updateCollaboratorSchema.parse(body)

    // Verify user is project owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { 
            collaborators: {
              some: { 
                userId: session.user.id,
                role: 'OWNER'
              }
            }
          }
        ]
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or insufficient permissions' }, { status: 404 })
    }

    // Update collaborator role
    const collaborator = await prisma.projectCollaborator.update({
      where: {
        id: collaboratorId,
        projectId,
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: collaborator.id,
      role: collaborator.role,
      createdAt: collaborator.createdAt,
      user: collaborator.user
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating collaborator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, collaboratorId } = await params

    // Get collaborator info first
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { user: true }
    })

    if (!collaborator || collaborator.projectId !== projectId) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    // Verify user is project owner, admin, or removing themselves
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { 
            collaborators: {
              some: { 
                userId: session.user.id,
                role: 'OWNER'
              }
            }
          }
        ]
      },
    })

    const canRemove = project || collaborator.userId === session.user.id

    if (!canRemove) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Remove collaborator
    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}