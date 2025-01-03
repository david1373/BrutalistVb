import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            match: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }))
        }))
      }))
    }))
  }
}));

// MSW server setup
export const server = setupServer(
  http.post('/api/transform', () => {
    return HttpResponse.json({
      transformedContent: 'Transformed content example'
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());