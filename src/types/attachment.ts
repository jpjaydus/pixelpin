export interface Attachment {
  id: string
  filename: string
  url: string
  mimeType?: string
  fileType?: string
  size?: number
  fileSize?: number
  createdAt: string
  uploadedBy?: {
    id: string
    name?: string | null
  }
}

export interface AttachmentUploadData {
  id: string
  filename: string
  url: string
  fileType: string
  fileSize: number
}