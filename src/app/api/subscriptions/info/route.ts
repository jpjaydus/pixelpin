import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserSubscriptionInfo } from '@/lib/subscription-limits'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptionInfo = await getUserSubscriptionInfo(session.user.id)
    return NextResponse.json(subscriptionInfo)
  } catch (error) {
    console.error('Subscription info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription info' },
      { status: 500 }
    )
  }
}