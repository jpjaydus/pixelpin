import { pusherServer, PUSHER_EVENTS, getAssetChannel } from './pusher'

export interface AnnotationEvent {
  id: string
  assetId: string
  authorId: string | null
  position: {
    x: number
    y: number
  }
  content: string
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
  updatedAt: string
  screenshot: string
  pageUrl: string
  metadata: Record<string, unknown>
  guestName?: string | null
  guestEmail?: string | null
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

export interface ReplyEvent {
  id: string
  annotationId: string
  authorId: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export interface CursorEvent {
  userId: string
  userName: string
  x: number
  y: number
  timestamp: number
}

export class RealtimeService {
  static async broadcastAnnotationCreated(assetId: string, annotation: AnnotationEvent) {
    try {
      if (!pusherServer) return
      await pusherServer.trigger(
        getAssetChannel(assetId),
        PUSHER_EVENTS.ANNOTATION_CREATED,
        annotation
      )
    } catch (error) {
      console.error('Failed to broadcast annotation created:', error)
    }
  }

  static async broadcastAnnotationUpdated(assetId: string, annotation: AnnotationEvent) {
    try {
      if (!pusherServer) return
      await pusherServer.trigger(
        getAssetChannel(assetId),
        PUSHER_EVENTS.ANNOTATION_UPDATED,
        annotation
      )
    } catch (error) {
      console.error('Failed to broadcast annotation updated:', error)
    }
  }

  static async broadcastAnnotationDeleted(assetId: string, annotationId: string) {
    try {
      if (!pusherServer) return
      await pusherServer.trigger(
        getAssetChannel(assetId),
        PUSHER_EVENTS.ANNOTATION_DELETED,
        { id: annotationId }
      )
    } catch (error) {
      console.error('Failed to broadcast annotation deleted:', error)
    }
  }

  static async broadcastReplyCreated(assetId: string, reply: ReplyEvent) {
    try {
      if (!pusherServer) return
      await pusherServer.trigger(
        getAssetChannel(assetId),
        PUSHER_EVENTS.REPLY_CREATED,
        reply
      )
    } catch (error) {
      console.error('Failed to broadcast reply created:', error)
    }
  }

  static async broadcastCursorMoved(assetId: string, cursor: CursorEvent) {
    try {
      if (!pusherServer) return
      await pusherServer.trigger(
        getAssetChannel(assetId),
        PUSHER_EVENTS.CURSOR_MOVED,
        cursor
      )
    } catch (error) {
      console.error('Failed to broadcast cursor moved:', error)
    }
  }
}