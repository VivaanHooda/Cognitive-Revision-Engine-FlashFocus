import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase.server'

export async function POST(req: Request) {
  try {
    const { username, password, name } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email: username,
      password,
      options: {
        data: {
          name: name || username.split('@')[0]
        }
      }
    })

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Registration failed - no user created' },
        { status: 400 }
      )
    }

    const user = {
      id: data.user.id,
      email: data.user.email || username,
      name: data.user.user_metadata?.name || name || username.split('@')[0]
    }

    return NextResponse.json({ user, session: data.session })
  } catch (err: any) {
    console.error('Registration server error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
