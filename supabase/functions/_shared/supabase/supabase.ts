// It's recommended using a specific version so that you dont get unexpected breaking changes
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import type { User } from 'npm:@supabase/supabase-js@2.57.4'

import { Database } from '../../../database.types.ts'

/**
 * Supabase client with anonymous (user-facing) access.
 *
 * - Uses the public anon key and respects Row Level Security (RLS) policies.
 * - Safe to expose to client-side environments.
 * - Suitable for operations scoped to the current authenticated user.
 *
 * Note: You don't need to define SUPABASE_URL or SUPABASE_ANON_KEY
 * Supabase already has access to it by default
 *
 * @constant
 */
export function createSupabaseClient(options = {}) {
  return createClient<Database>(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, options)
}

/**
 * Supabase client with admin privileges.
 *
 * IMPORTANT: Use this only for operations where full access is required like deleting user
 *
 * - Uses the Supabase service role key to bypass Row Level Security (RLS).
 * - Intended for trusted server-side operations only.
 * - Grants full access to all database operations.
 *
 * @remarks
 * This client should never be exposed to client-side code. Use it only in secure
 * environments such as Edge Functions or background jobs.
 *
 * Note: You don't need to define SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
 * Supabase already has access to it by default
 *
 * @constant
 */
export function createSupabaseAdmin(options = {}) {
  return createClient<Database>(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, options)
}

export { User }
