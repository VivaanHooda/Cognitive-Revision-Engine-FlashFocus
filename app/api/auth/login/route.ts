import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase.server'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Login failed - no session created' },
        { status: 401 }
      )
    }

    const user = {
      id: data.user.id,
      email: data.user.email || username,
      name: data.user.user_metadata?.name || username.split('@')[0]
    }

    return NextResponse.json({ 
      user,
      session: data.session 
    })
  } catch (err: any) {
    console.error('Login server error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
