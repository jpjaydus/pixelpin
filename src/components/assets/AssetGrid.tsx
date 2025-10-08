'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileImage, FileText, ExternalLink, MoreHorizontal, Trash2, Eye } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'URL';
  url: string;
  createdAt: string;
}

interface AssetGridProps {
  assets: Asset[];
  projectId: string;
  onDelete: (assetId: string) => void;
}

export function AssetGrid({ assets, projectId, onDelete }: AssetGridProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'IMAGE':
        return <FileImage className="h-8 w-8 text-blue-500" />;
      case 'PDF':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'URL':
        return <ExternalLink className="h-8 w-8 text-green-500" />;
    }
  };

  const getAssetThumbnail = (asset: Asset) => {
    if (asset.type === 'IMAGE') {
      return (
        <div className="aspect-video bg-neutral-100 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full flex items-center justify-center">
            {getAssetIcon(asset.type)}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
        {getAssetIcon(asset.type)}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(assetId);
      } else {
        alert('Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset');
    }
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <FileImage className="h-12 w-12 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No assets yet
        </h3>
        <p className="text-neutral-600">
          Upload images, PDFs, or add website URLs to start collecting feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
        >
          {/* Thumbnail */}
          {getAssetThumbnail(asset)}

          {/* Asset Info */}
          <div className="mt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-900 truncate" title={asset.name}>
                  {asset.name}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {asset.type} • {formatDate(asset.createdAt)}
                </p>
              </div>

              {/* Actions Dropdown */}
              <div className="relative ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                  onClick={() => setActiveDropdown(activeDropdown === asset.id ? null : asset.id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {activeDropdown === asset.id && (
                  <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <Link
                      href={`/projects/${projectId}/assets/${asset.id}`}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    {asset.type === 'URL' && (
                      <>
                        <Link
                          href={`/projects/${projectId}/assets/${asset.id}/immersive`}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          Immersive Mode
                        </Link>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open URL
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleDelete(asset.id);
                        setActiveDropdown(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 space-y-2">
              <Link href={`/projects/${projectId}/assets/${asset.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Asset
                </Button>
              </Link>
              
              {asset.type === 'URL' && (
                <Link href={`/projects/${projectId}/assets/${asset.id}/immersive`} className="block">
                  <Button variant="default" size="sm" className="w-full">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    Immersive Mode
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}