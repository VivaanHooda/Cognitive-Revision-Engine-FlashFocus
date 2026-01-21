import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth.server'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('Get user error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
