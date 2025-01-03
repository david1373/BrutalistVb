import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { browserConfig } from './config/browser';

const { url, anonKey } = browserConfig.supabase;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase configuration.\n' +
    'Please ensure your .env file contains:\n' +
    '  VITE_SUPABASE_URL=your-project-url\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// Create the Supabase client
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false }
});