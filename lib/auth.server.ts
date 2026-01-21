import { createServerSupabaseClient } from './supabase.server'

export type PublicUser = {
  id: string
  email: string
  name: string
}

/**
 * Gets the authenticated user from the request
 * Uses Supabase SSR with cookie-based authentication
 */
export async function getUserFromRequest(): Promise<PublicUser | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<PublicUser> {
  const user = await getUserFromRequest()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
