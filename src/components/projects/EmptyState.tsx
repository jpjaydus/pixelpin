import { Button } from '@/components/ui/Button';
import { FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateProject: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <FolderOpen className="h-12 w-12 text-neutral-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        No projects yet
      </h3>
      
      <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
        Create your first project to start collecting visual feedback from your team and clients.
      </p>
      
      <Button onClick={onCreateProject} size="lg" className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Your First Project
      </Button>
      
      <div className="mt-8 text-sm text-neutral-500">
        <p className="mb-2">With PixelPin projects, you can:</p>
        <ul className="space-y-1 text-neutral-400">
          <li>• Upload images, PDFs, or add website URLs</li>
          <li>• Leave precise visual feedback with annotations</li>
          <li>• Collaborate with your team in real-time</li>
          <li>• Track feedback status from open to resolved</li>
        </ul>
      </div>
    </div>
  );
}