import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../lib/supabase';

interface TransformContentParams {
  articleId: string;
  content: string;
}

const transformContent = async ({ articleId, content }: TransformContentParams) => {
  // First, call our transformation API
  const response = await fetch('/api/transform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to transform content');
  }

  const { transformedContent } = await response.json();

  // Then update Supabase with the transformed content
  const { error } = await supabaseClient
    .from('articles')
    .update({ 
      transformed_content: transformedContent,
      transformed_at: new Date().toISOString()
    })
    .eq('id', articleId);

  if (error) throw error;

  return transformedContent;
};

export const useTransformContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transformContent,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ 
        queryKey: ['article', variables.articleId] 
      });
    },
    retry: 2,
    onError: (error) => {
      console.error('Error transforming content:', error);
    }
  });
};