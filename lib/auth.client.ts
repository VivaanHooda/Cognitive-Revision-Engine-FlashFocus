import { supabase } from "./supabase.client";

async function safeUserFromSupabase() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      name: (user.user_metadata as any)?.name || user.email || "",
    };
  } catch (e) {
    return null;
  }
}

export const register = async (
  username: string,
  password: string,
  name?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email: username,
    password,
    options: { data: { name } },
  } as any);
  if (error) throw new Error(error.message);
  // If email confirmations are enabled, user may be null until confirmed.
  const user = data.user;
  return user
    ? {
        id: user.id,
        email: user.email || "",
        name: (user.user_metadata as any)?.name || user.email || "",
      }
    : null;
};

export const login = async (username: string, password: string) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({ email: username, password });
  if (error) throw new Error(error.message);
  if (!session?.user) return null;
  const user = session.user;
  return {
    id: user.id,
    email: user.email || "",
    name: (user.user_metadata as any)?.name || user.email || "",
  };
};

export const logout = async () => {
  await supabase.auth.signOut();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (e) {
    // ignore
  }
};

export const me = async () => {
  return await safeUserFromSupabase();
};
