"use client"

import { createClient } from "./supabase.client"

export type User = {
  id: string
  email: string
  name: string
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<User | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0]
      }
    }
  })

  if (error) {
    console.error('Registration error:', error)
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error('No user returned from registration')
  }

  return {
    id: data.user.id,
    email: data.user.email || email,
    name: data.user.user_metadata?.name || name || email.split('@')[0]
  }
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Login error:', error)
    throw new Error(error.message)
  }

  if (!data.session || !data.user) {
    throw new Error('No session created')
  }

  return {
    id: data.user.id,
    email: data.user.email || email,
    name: data.user.user_metadata?.name || email.split('@')[0]
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

/**
 * Get the current user
 */
export async function me(): Promise<User | null> {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session error:', error)
    return null
  }
  
  return session
}
