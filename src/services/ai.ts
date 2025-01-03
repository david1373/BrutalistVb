import { supabase } from '../lib/supabase';

function rewriteInKerouacStyle(content: string): string {
  // This is where we'd integrate with an AI service
  // For now, we'll just add some Kerouac-style phrases
  const kerouacPhrases = [
    "man, dig this: ",
    "and yeah, baby, ",
    "like wow, ",
    "and I'm telling you, "
  ];
  
  const paragraphs = content.split('\n\n');
  const rewritten = paragraphs.map(para => {
    const phrase = kerouacPhrases[Math.floor(Math.random() * kerouacPhrases.length)];
    return phrase + para;
  }).join('\n\n');
  
  return rewritten;
}

export async function processArticle(articleId: string): Promise<void> {
  // Get the original content
  const { data: article } = await supabase
    .from('articles')
    .select('original_content')
    .eq('id', articleId)
    .single();
    
  if (!article?.original_content) return;
  
  // Rewrite the content
  const rewrittenContent = rewriteInKerouacStyle(article.original_content);
  
  // Update the article
  await supabase
    .from('articles')
    .update({ 
      rewritten_content: rewrittenContent,
      is_processed: true 
    })
    .eq('id', articleId);
}