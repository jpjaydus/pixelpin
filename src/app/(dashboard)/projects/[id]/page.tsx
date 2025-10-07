'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AssetUploader } from '@/components/assets/AssetUploader';
import { AssetGrid } from '@/components/assets/AssetGrid';
import { ArrowLeft, Calendar, FolderOpen, Settings } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  assets: Asset[];
  _count: {
    assets: number;
  };
}

interface Asset {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'URL';
  url: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch project details
  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else if (response.status === 404) {
        setError('Project not found');
      } else {
        setError('Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Fetch assets
  const fetchAssets = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/assets`);
      if (response.ok) {
        const data = await response.json();
        setProject(prev => prev ? { ...prev, assets: data.assets } : null);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  useEffect(() => {
    if (session && projectId) {
      fetchProject();
    }
  }, [session, projectId]); // fetchProject is stable, no need to include

  const handleAssetUpload = () => {
    fetchAssets();
  };

  const handleAssetDelete = (assetId: string) => {
    setProject(prev => 
      prev ? {
        ...prev,
        assets: prev.assets.filter(asset => asset.id !== assetId),
        _count: { assets: prev._count.assets - 1 }
      } : null
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {error || 'Project not found'}
          </h2>
          <p className="text-neutral-600 mb-6">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-900">{project.name}</h1>
            {project.description && (
              <p className="text-neutral-600 mt-1">{project.description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Project Stats */}
        <div className="flex items-center gap-6 text-sm text-neutral-500">
          <div className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4" />
            <span>{project._count.assets} assets</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
          {project.updatedAt !== project.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Updated {formatDate(project.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Assets</h2>
          <p className="text-neutral-600 text-sm">
            Upload files or add URLs to collect visual feedback
          </p>
        </div>
        <AssetUploader projectId={projectId} onUpload={handleAssetUpload} />
      </div>

      {/* Assets Grid */}
      <AssetGrid
        assets={project.assets}
        projectId={projectId}
        onDelete={handleAssetDelete}
      />
    </div>
  );
}