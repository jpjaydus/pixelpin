'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Upload, Link as LinkIcon, X, FileImage, FileText } from 'lucide-react';

interface AssetUploaderProps {
  projectId: string;
  onUpload: () => void;
}

export function AssetUploader({ projectId, onUpload }: AssetUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urlData, setUrlData] = useState({ name: '', url: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and PDFs under 10MB are allowed.');
    } else {
      setError('');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and PDFs under 10MB are allowed.');
    } else {
      setError('');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setLoading(true);
    setError('');

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/projects/${projectId}/assets`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
      }

      // Reset and close
      setSelectedFiles([]);
      setIsOpen(false);
      onUpload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const addUrlAsset = async () => {
    if (!urlData.name || !urlData.url) {
      setError('Both name and URL are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(urlData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add URL');
      }

      // Reset and close
      setUrlData({ name: '', url: '' });
      setIsOpen(false);
      onUpload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (uploadType === 'file') {
      uploadFiles();
    } else {
      addUrlAsset();
    }
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setUrlData({ name: '', url: '' });
    setError('');
    setUploadType('file');
  };

  const handleClose = () => {
    if (!loading) {
      resetModal();
      setIsOpen(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileImage className="h-8 w-8 text-blue-500" />;
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Add Assets
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Add Assets" size="lg">
        <div className="space-y-6">
          {/* Upload Type Selector */}
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setUploadType('file')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadType === 'file'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload Files
            </button>
            <button
              onClick={() => setUploadType('url')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadType === 'url'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LinkIcon className="h-4 w-4 inline mr-2" />
              Add URL
            </button>
          </div>

          {uploadType === 'file' ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-300 hover:border-neutral-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Supports images (JPEG, PNG, GIF, WebP) and PDFs up to 10MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-neutral-900">Selected Files:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="p-1 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* URL Input */}
              <div className="space-y-4">
                <Input
                  label="Asset Name"
                  value={urlData.name}
                  onChange={(e) => setUrlData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a name for this asset"
                  required
                />
                <Input
                  label="Website URL"
                  value={urlData.url}
                  onChange={(e) => setUrlData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  type="url"
                  required
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={uploadType === 'file' ? selectedFiles.length === 0 : !urlData.name || !urlData.url}
              className="flex-1"
            >
              {uploadType === 'file' ? 'Upload Files' : 'Add URL'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}