import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ImmersiveAnnotationView } from '@/components/annotation/ImmersiveAnnotationView'

interface ImmersiveAssetPageProps {
  params: Promise<{
    id: string
    assetId: string
  }>
}

export default async function ImmersiveAssetPage({
  params
}: ImmersiveAssetPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    return notFound()
  }

  const { id: projectId, assetId } = await params

  try {
    // Fetch asset with project and collaborator information
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
        }
      },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            },
            collaborators: {
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
            }
          }
        }
      }
    })

    if (!asset) {
      return notFound()
    }

    // Only allow URL assets in immersive mode
    if (asset.type !== 'URL') {
      return notFound()
    }

    return (
      <ImmersiveAnnotationView
        asset={asset}
        project={asset.project}
        currentUser={session.user}
        isGuest={false}
      />
    )
  } catch (error) {
    console.error('Failed to load immersive asset page:', error)
    return notFound()
  }
}

export async function generateMetadata({
  params
}: ImmersiveAssetPageProps) {
  const { assetId } = await params

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        name: true,
        project: {
          select: {
            name: true
          }
        }
      }
    })

    if (!asset) {
      return {
        title: 'Asset Not Found - PixelPin'
      }
    }

    return {
      title: `${asset.name} - ${asset.project.name} - PixelPin`,
      description: `Annotate and collaborate on ${asset.name}`
    }
  } catch (error) {
    return {
      title: 'Asset - PixelPin'
    }
  }
}