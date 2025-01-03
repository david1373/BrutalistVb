import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransformContent } from '../useTransformContent';
import { createWrapper } from '../../test/test-utils';

describe('useTransformContent', () => {
  it('transforms content successfully', async () => {
    const { result } = renderHook(() => useTransformContent(), {
      wrapper: createWrapper()
    });

    const mockContent = {
      articleId: '1',
      content: 'Original content'
    };

    result.current.mutate(mockContent);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe('Transformed content example');
  });

  it('handles transformation errors', async () => {
    const { result } = renderHook(() => useTransformContent(), {
      wrapper: createWrapper()
    });

    // Mock error response
    server.use(
      http.post('/api/transform', () => {
        return HttpResponse.error();
      })
    );

    result.current.mutate({
      articleId: '1',
      content: 'Original content'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});