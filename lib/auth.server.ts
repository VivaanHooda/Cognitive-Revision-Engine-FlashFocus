import { createServerSupabaseClient, supabaseAdmin } from './supabase.server'

export type PublicUser = {
  id: string
  email: string
  name: string
}

/**
 * Gets the authenticated user from the request
 * Tries Authorization header first (for client-side requests), then falls back to cookies (for SSR)
 */
export async function getUserFromRequest(req?: Request): Promise<PublicUser | null> {
  try {
    // First, try to get JWT from Authorization header (preferred for API routes)
    if (req) {
      const authHeader = req.headers.get('Authorization')
      console.log('[auth.server] Authorization header present:', !!authHeader);
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log('[auth.server] Verifying JWT token...');
        
        try {
          // Use admin client to verify the JWT
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          
          if (!error && user) {
            console.log('[auth.server] ✓ Successfully authenticated via Authorization header, user:', user.id)
            return {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            }
          } else if (error) {
            console.log('[auth.server] ✗ Authorization header token invalid:', error.message)
          }
        } catch (tokenError) {
          console.log('[auth.server] ✗ Error verifying token:', tokenError)
        }
      }
    } else {
      console.log('[auth.server] No request object provided');
    }
    
    // Fall back to cookie-based auth (for SSR/Server Components)
    console.log('[auth.server] Trying cookie-based auth...');
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('[auth.server] ✗ Cookie auth error:', error.message)
      return null
    }
    
    if (user) {
      console.log('[auth.server] ✓ Successfully authenticated via cookies, user:', user.id)
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      }
    }
    
    console.log('[auth.server] ✗ No user found via cookies');
    return null
  } catch (error) {
    console.error('[auth.server] ✗ Error getting user from request:', error)
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
