import { useQuery } from '@tanstack/react-query';
import { getLatestArticles } from '../services/articles';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: () => getLatestArticles(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}