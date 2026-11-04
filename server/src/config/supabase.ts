import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Copy .env.example to .env and fill in your Supabase credentials.'
  )
}

/**
 * Server-side Supabase client using the service role key.
 * Bypasses Row Level Security — use only inside authenticated controller logic.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export default supabase
