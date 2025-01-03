import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') });

// Global test timeout
jest.setTimeout(30000); // 30 seconds

// Clean up function after all tests
afterAll(async () => {
  // Add any global cleanup here
});