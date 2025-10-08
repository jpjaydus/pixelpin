import { ReactNode } from 'react'

interface AnnotationLayoutProps {
  children: ReactNode
}

export default function AnnotationLayout({ children }: AnnotationLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {children}
    </div>
  )
}