// test/setupEnv.ts
import 'dotenv/config';

console.log('[DEBUG] SUPABASE_URL from .env =>', process.env.SUPABASE_URL);
console.log('[DEBUG] SUPABASE_ANON_KEY from .env =>', process.env.SUPABASE_ANON_KEY);
console.log('[DEBUG] SUPABASE_SERVICE_KEY from .env =>', process.env.SUPABASE_SERVICE_KEY);

