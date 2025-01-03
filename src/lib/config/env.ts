import { config } from 'dotenv';

// Load environment variables in Node.js environment
if (typeof process !== 'undefined') {
  config();
}

// Environment variable validation with detailed error messages
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please ensure your .env file contains: ${name}=your-value`
    );
  }
  return value;
}

// Browser environment config
export function getBrowserEnv() {
  return {
    supabase: {
      url: validateEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
      anonKey: validateEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
    }
  } as const;
}

// Server environment config
export function getServerEnv() {
  return {
    supabase: {
      url: validateEnvVar('SUPABASE_URL', process.env.SUPABASE_URL),
      serviceKey: validateEnvVar('SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY),
    },
    server: {
      port: parseInt(process.env.PORT || '3001'),
    }
  } as const;
}