import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui/Loading'

// Lazy load heavy components
export const LazyAnnotationCanvas = dynamic(
  () => import('@/components/annotations/AnnotationCanvas'),
  {
    loading: () => <Loading size="lg" text="Loading annotation canvas..." />,
    ssr: false, // Fabric.js doesn't work with SSR
  }
)

export const LazyAnnotationPanel = dynamic(
  () => import('@/components/annotations/AnnotationPanel'),
  {
    loading: () => <Loading size="md" text="Loading annotation panel..." />,
  }
)

export const LazyUserPresence = dynamic(
  () => import('@/components/collaboration/UserPresence'),
  {
    loading: () => <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />,
  }
)

export const LazyUpgradeModal = dynamic(
  () => import('@/components/subscriptions/UpgradeModal'),
  {
    loading: () => <Loading size="md" />,
  }
)