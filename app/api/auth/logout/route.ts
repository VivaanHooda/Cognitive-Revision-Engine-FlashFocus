import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase.server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Logout error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
