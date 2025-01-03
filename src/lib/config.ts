import { config } from 'dotenv';

// Load environment variables
config();

function validateEnv() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(key => `  - ${key}`).join('\n')}`
    );
  }
}

// Validate environment variables
validateEnv();

export const supabaseConfig = {
  url: process.env.VITE_SUPABASE_URL!,
  anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
  serviceKey: process.env.SUPABASE_SERVICE_KEY!
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10)
};