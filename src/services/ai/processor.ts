import { supabase } from '../../lib/supabase';
import { rewriteInKerouacStyle } from './kerouac';

export async function processArticle(articleId: string): Promise<void> {
  // Get the original content
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('original_content')
    .eq('id', articleId)
    .single();
    
  if (fetchError || !article?.original_content) {
    throw new Error(`Failed to fetch article ${articleId}: ${fetchError?.message}`);
  }
  
  // Rewrite the content
  const rewrittenContent = rewriteInKerouacStyle(article.original_content);
  
  // Update the article
  const { error: updateError } = await supabase
    .from('articles')
    .update({ 
      rewritten_content: rewrittenContent,
      is_processed: true 
    })
    .eq('id', articleId);
    
  if (updateError) {
    throw new Error(`Failed to update article ${articleId}: ${updateError.message}`);
  }
}