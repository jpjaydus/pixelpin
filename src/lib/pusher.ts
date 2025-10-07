import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side Pusher instance
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
)

// Channel names
export const getProjectChannel = (projectId: string) => `project-${projectId}`
export const getAssetChannel = (assetId: string) => `asset-${assetId}`
export const getPresenceChannel = (assetId: string) => `presence-asset-${assetId}`

// Event names
export const PUSHER_EVENTS = {
  ANNOTATION_CREATED: 'annotation:created',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',
  REPLY_CREATED: 'reply:created',
  CURSOR_MOVED: 'cursor:moved',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
} as const