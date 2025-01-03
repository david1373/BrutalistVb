import { supabase } from './lib/supabase';
import { processArticle } from '../src/services/ai/processor';
import { logError } from '../src/scrapers/utils/logger';

async function processUnprocessedArticles() {
  console.log('🤖 Starting content processing...');
  
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title')
    .eq('is_processed', false);
    
  if (fetchError) {
    logError('Failed to fetch unprocessed articles', fetchError);
    process.exit(1);
  }
    
  if (!articles?.length) {
    console.log('✨ No articles to process');
    process.exit(0);
  }
  
  console.log(`📝 Found ${articles.length} articles to process\n`);
  
  for (const article of articles) {
    try {
      console.log(`Processing: ${article.title}`);
      await processArticle(article.id);
      console.log(`✓ Processed article ${article.id}\n`);
    } catch (error) {
      logError(`Failed to process article ${article.id}`, error);
    }
  }
  
  console.log('✨ Content processing complete!');
}