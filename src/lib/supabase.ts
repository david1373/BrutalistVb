import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing Supabase URL')
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase Anon Key')
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
)