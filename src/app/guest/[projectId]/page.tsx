import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuestAnnotationView } from '@/components/annotation/GuestAnnotationView'

interface GuestProjectPageProps {
  params: {
    projectId: string
  }
  searchParams: {
    token?: string
  }
}

export default async function GuestProjectPage({
  params,
  searchParams
}: GuestProjectPageProps) {
  const { projectId } = params
  const { token } = searchParams

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This guest access link is missing required parameters.</p>
        </div>
      </div>
    )
  }

  try {
    // Find project with matching share token
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        shareToken: token,
        guestAccessEnabled: true
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assets: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!project) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              This project is not available for guest access or the link has expired.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the project owner for a new link.
            </p>
          </div>
        </div>
      )
    }

    return (
      <GuestAnnotationView
        project={project}
        shareToken={token}
      />
    )
  } catch (error) {
    console.error('Failed to load guest project:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load project. Please try again later.</p>
        </div>
      </div>
    )
  }
}

export async function generateMetadata({
  params,
  searchParams
}: GuestProjectPageProps) {
  const { projectId } = params
  const { token } = searchParams

  if (!token) {
    return {
      title: 'Invalid Guest Link - PixelPin'
    }
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        shareToken: token,
        guestAccessEnabled: true
      },
      select: {
        name: true,
        description: true
      }
    })

    if (!project) {
      return {
        title: 'Project Not Found - PixelPin'
      }
    }

    return {
      title: `${project.name} - PixelPin Guest Access`,
      description: project.description || `Review and comment on ${project.name}`
    }
  } catch (error) {
    return {
      title: 'Project - PixelPin Guest Access'
    }
  }
}