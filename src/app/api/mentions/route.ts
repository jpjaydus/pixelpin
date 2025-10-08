import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMentionsForUser } from '@/lib/mentions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const mentions = await getMentionsForUser(session.user.id, limit)

    return NextResponse.json({ mentions })
  } catch (error) {
    console.error('Failed to get mentions:', error)
    return NextResponse.json(
      { error: 'Failed to get mentions' },
      { status: 500 }
    )
  }
}