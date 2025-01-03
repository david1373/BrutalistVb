import { useQuery } from '@tanstack/react-query';
import { getArticle } from '../services/articles';

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => {
      if (!id) throw new Error('Article ID is required');
      return getArticle(id);
    },
    enabled: !!id, // Only run query if we have an ID
  });
}