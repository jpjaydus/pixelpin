'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient, getAssetChannel, getPresenceChannel, PUSHER_EVENTS } from '@/lib/pusher'
import type { Channel, PresenceChannel } from 'pusher-js'

interface UseRealtimeProps {
  assetId: string
  onAnnotationCreated?: (annotation: {
    id: string
    content: string
    type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
    status: 'OPEN' | 'RESOLVED'
    position: { x: number; y: number; width?: number; height?: number }
    createdAt: string
    author: { id: string; name: string | null; email: string; image: string | null }
    replies: Array<{ id: string; content: string; createdAt: string; author: { id: string; name: string | null; email: string; image: string | null } }>
  }) => void
  onAnnotationUpdated?: (annotation: {
    id: string
    content: string
    type: 'COMMENT' | 'RECTANGLE' | 'ARROW' | 'TEXT'
    status: 'OPEN' | 'RESOLVED'
    position: { x: number; y: number; width?: number; height?: number }
    createdAt: string
    author: { id: string; name: string | null; email: string; image: string | null }
    replies: Array<{ id: string; content: string; createdAt: string; author: { id: string; name: string | null; email: string; image: string | null } }>
  }) => void
  onAnnotationDeleted?: (data: { id: string }) => void
  onReplyCreated?: (reply: {
    id: string
    annotationId: string
    content: string
    createdAt: string
    author: { id: string; name: string | null; email: string; image: string | null }
  }) => void
  onCursorMoved?: (cursor: {
    userId: string
    userName: string
    x: number
    y: number
  }) => void
  onUserJoined?: (user: {
    id: string
    user_info: {
      id: string
      name: string
      email: string
      image?: string
    }
  }) => void
  onUserLeft?: (user: {
    id: string
    user_info: {
      id: string
      name: string
      email: string
      image?: string
    }
  }) => void
}

export function useRealtime({
  assetId,
  onAnnotationCreated,
  onAnnotationUpdated,
  onAnnotationDeleted,
  onReplyCreated,
  onCursorMoved,
  onUserJoined,
  onUserLeft,
}: UseRealtimeProps) {
  const { data: session } = useSession()
  const channelRef = useRef<Channel | null>(null)
  const presenceChannelRef = useRef<PresenceChannel | null>(null)

  useEffect(() => {
    if (!session?.user?.id || !assetId || !pusherClient) return

    // Subscribe to asset channel for annotation updates
    const assetChannel = pusherClient.subscribe(getAssetChannel(assetId))
    channelRef.current = assetChannel

    // Subscribe to presence channel for user presence
    const presenceChannel = pusherClient.subscribe(getPresenceChannel(assetId)) as PresenceChannel
    presenceChannelRef.current = presenceChannel

    // Bind event listeners
    if (onAnnotationCreated) {
      assetChannel.bind(PUSHER_EVENTS.ANNOTATION_CREATED, onAnnotationCreated)
    }

    if (onAnnotationUpdated) {
      assetChannel.bind(PUSHER_EVENTS.ANNOTATION_UPDATED, onAnnotationUpdated)
    }

    if (onAnnotationDeleted) {
      assetChannel.bind(PUSHER_EVENTS.ANNOTATION_DELETED, onAnnotationDeleted)
    }

    if (onReplyCreated) {
      assetChannel.bind(PUSHER_EVENTS.REPLY_CREATED, onReplyCreated)
    }

    if (onCursorMoved) {
      assetChannel.bind(PUSHER_EVENTS.CURSOR_MOVED, onCursorMoved)
    }

    if (onUserJoined) {
      presenceChannel.bind('pusher:member_added', onUserJoined)
    }

    if (onUserLeft) {
      presenceChannel.bind('pusher:member_removed', onUserLeft)
    }

    return () => {
      // Unbind all events and unsubscribe
      assetChannel.unbind_all()
      presenceChannel.unbind_all()
      if (pusherClient) {
        pusherClient.unsubscribe(getAssetChannel(assetId))
        pusherClient.unsubscribe(getPresenceChannel(assetId))
      }
    }
  }, [
    session?.user?.id,
    assetId,
    onAnnotationCreated,
    onAnnotationUpdated,
    onAnnotationDeleted,
    onReplyCreated,
    onCursorMoved,
    onUserJoined,
    onUserLeft,
  ])

  const broadcastCursorMove = (x: number, y: number) => {
    if (!session?.user || !channelRef.current) return

    channelRef.current.trigger('client-cursor-moved', {
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      x,
      y,
      timestamp: Date.now(),
    })
  }

  const getPresenceMembers = (): Array<{
    id: string
    user_info: {
      id: string
      name: string
      email: string
      image?: string
    }
  }> => {
    if (!presenceChannelRef.current) return []
    return Object.values(presenceChannelRef.current.members.members || {}) as Array<{
      id: string
      user_info: {
        id: string
        name: string
        email: string
        image?: string
      }
    }>
  }

  return {
    broadcastCursorMove,
    getPresenceMembers,
  }
}