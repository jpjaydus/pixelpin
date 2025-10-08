import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ImmersiveAnnotationView } from '@/components/annotation/ImmersiveAnnotationView'

interface ImmersiveAnnotationPageProps {
  params: {
    projectId: string
    assetId: string
  }
}

export default async function ImmersiveAnnotationPage({ 
  params 
}: ImmersiveAnnotationPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    notFound()
  }

  // Fetch the asset and project
  const asset = await prisma.asset.findUnique({
    where: { id: params.assetId },
    include: {
      project: {
        include: {
          owner: true,
          collaborators: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })

  if (!asset || asset.projectId !== params.projectId) {
    notFound()
  }

  // Check if user has access to this project
  const hasAccess = 
    asset.project.ownerId === session.user?.id ||
    asset.project.collaborators.some(collab => collab.userId === session.user?.id)

  if (!hasAccess) {
    notFound()
  }

  // Only URL assets can use the immersive annotation interface
  if (asset.type !== 'URL') {
    notFound()
  }

  return (
    <ImmersiveAnnotationView 
      asset={asset}
      project={asset.project}
      currentUser={session.user}
    />
  )
}