import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabaseClient } from '../lib/supabase';

interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  transformedContent?: string;
  sourceId: string;
  sourceName: string;
}

interface UseArticlesOptions {
  limit?: number;
  category?: string;
  useInfinite?: boolean;
}

const fetchArticles = async ({ 
  pageParam = 0, 
  limit = 9,
  category 
}: {
  pageParam?: number;
  limit?: number;
  category?: string;
}) => {
  const { data, error } = await supabaseClient
    .from('articles')
    .select(`
      id,
      title,
      content,
      image_url,
      author,
      published_at,
      transformed_content,
      source_id,
      sources(name)
    `)
    .order('published_at', { ascending: false })
    .range(pageParam * limit, (pageParam + 1) * limit - 1)
    .match(category ? { category } : {});

  if (error) throw error;

  return data.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content,
    imageUrl: article.image_url,
    author: article.author,
    publishedAt: article.published_at,
    transformedContent: article.transformed_content,
    sourceId: article.source_id,
    sourceName: article.sources.name
  }));
};

export const useArticles = ({ limit = 9, category, useInfinite = false }: UseArticlesOptions = {}) => {
  // Use infinite query for pagination
  if (useInfinite) {
    return useInfiniteQuery({
      queryKey: ['articles', category, limit],
      queryFn: ({ pageParam = 0 }) => fetchArticles({ pageParam, limit, category }),
      getNextPageParam: (lastPage, allPages) => 
        lastPage.length === limit ? allPages.length : undefined,
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    });
  }

  // Use regular query for single page
  return useQuery({
    queryKey: ['articles', category, limit],
    queryFn: () => fetchArticles({ limit, category }),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });
};