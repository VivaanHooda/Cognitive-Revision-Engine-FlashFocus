import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase.server";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: number;
};

/**
 * Validates the request authentication using Supabase.
 * Expects 'Authorization: Bearer <token>' header.
 * 
 * Flow:
 * 1. Checks for Authorization header (Bearer token)
 * 2. Verifies token with Supabase Admin Auth
 * 3. Returns user object if valid, null otherwise
 */
export async function getUserFromRequest(req: Request | NextRequest) {
  // Check for an Authorization: Bearer <token> header (Supabase access token)
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
    
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.split(" ")[1];
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (!error && data?.user) {
        const u = data.user;
        return {
          id: u.id,
          email: u.email || "",
          name: (u.user_metadata as any)?.name || u.email || "",
        };
      }
    } catch (e) {
      console.error("Auth validation error:", e);
      return null;
    }
  }

  // Cookie-based fallback for better compatibility
  // Check for NextRequest cookies
  if ('cookies' in req) {
    const nextReq = req as NextRequest;
    const cookies = nextReq.cookies.getAll();
    
    for (const cookie of cookies) {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('auth')) {
        try {
          // Attempt to parse existing session cookie
          // Can be JSON or plain string depending on version
          let token = cookie.value;
          if (token.startsWith('{')) {
            const parsed = JSON.parse(token);
            if (parsed.access_token) token = parsed.access_token;
          }
           
          // Validate this token
          const { data, error } = await supabaseAdmin.auth.getUser(token);
          if (!error && data?.user) {
             const u = data.user;
             return {
               id: u.id,
               email: u.email || "",
               name: (u.user_metadata as any)?.name || u.email || "",
             };
          }
        } catch (e) {
          // ignore cookie parse errors
        }
      }
    }
  }

  return null;
}
