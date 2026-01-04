import {
  register as supaRegister,
  login as supaLogin,
  logout as supaLogout,
  me as supaMe,
} from "./auth.client";
import { User } from "./types";

// This module used to simulate auth via localStorage. The app now uses Supabase Auth.
// Keep a small compatibility wrapper so any existing imports continue to work but
// delegate real work to `lib/auth.client.ts` which uses Supabase.

export const authService = {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User | null; token: string | null }> {
    const user = await supaRegister(email, password, name as any);
    // Supabase manages tokens/session; token is not exposed here
    return { user, token: null };
  },

  async login(
    email: string,
    password: string
  ): Promise<{ user: User | null; token: string | null }> {
    const user = await supaLogin(email, password);
    return { user, token: null };
  },

  async logout(): Promise<void> {
    await supaLogout();
  },

  // NOTE: Previously synchronous; it is now async to use Supabase session info.
  async getCurrentUser(): Promise<User | null> {
    return await supaMe();
  },
};
