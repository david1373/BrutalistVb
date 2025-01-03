import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseConfig } from './config';

if (!supabaseConfig.serviceKey) {
  throw new Error('Missing Supabase service key');
}

export const supabaseAdmin = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.serviceKey,
  {
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);