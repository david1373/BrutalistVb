import { config } from 'dotenv';
import { getServerEnv } from './env';

// Load environment variables
config();

export const serverConfig = getServerEnv();