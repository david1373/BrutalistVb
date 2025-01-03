import { config } from 'dotenv';

// Load environment variables for Node.js environment
config();

// Validate required environment variables
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missing.map(key => `  - ${key}`).join('\n')}`
  );
}

export const cliConfig = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  }
};