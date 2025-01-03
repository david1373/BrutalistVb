import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';
import { serverConfig } from '../../lib/config/server';

const { url, serviceKey } = serverConfig.supabase;

// Create the Supabase client with service key
export const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false }
});