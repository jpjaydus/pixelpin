import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.text()
    const params = new URLSearchParams(body)
    const socketId = params.get('socket_id')
    const channelName = params.get('channel_name')

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Extract asset ID from channel name for presence channels
    if (channelName.startsWith('presence-asset-')) {
      const assetId = channelName.replace('presence-asset-', '')
      
      // Verify user has access to this asset
      const asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
          project: {
            ownerId: session.user.id,
          },
        },
      })

      if (!asset) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Authenticate for presence channel
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          id: session.user.id,
          name: session.user.name || session.user.email,
          email: session.user.email,
          image: session.user.image,
        },
      }

      const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData)
      return NextResponse.json(authResponse)
    }

    // For private channels (asset updates)
    if (channelName.startsWith('asset-')) {
      const assetId = channelName.replace('asset-', '')
      
      // Verify user has access to this asset
      const asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
          project: {
            ownerId: session.user.id,
          },
        },
      })

      if (!asset) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const authResponse = pusherServer.authorizeChannel(socketId, channelName)
      return NextResponse.json(authResponse)
    }

    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}