// src/server/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';

/**
 * Reads Supabase config from Node environment variables.
 * Make sure you define SUPABASE_URL and SUPABASE_SERVICE_KEY
 * in your .env/.env.test or your runtime environment.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});