import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useArticles } from '../useArticles';
import { createWrapper } from '../../test/test-utils';
import { mockArticles } from '../../test/mocks/articles';
import { supabaseClient } from '../../lib/supabase';

vi.mock('../../lib/supabase');

describe('useArticles', () => {
  beforeEach(() => {
    vi.mocked(supabaseClient.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({
        data: mockArticles,
        error: null
      })
    }));
  });

  it('fetches articles successfully', async () => {
    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockArticles);
  });

  it('handles pagination correctly', async () => {
    const { result } = renderHook(
      () => useArticles({ useInfinite: true, limit: 2 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(true);
    });

    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });
  });
});