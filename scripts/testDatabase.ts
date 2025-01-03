import { supabase } from './lib/supabase';

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test sources table
    console.log('📚 Checking sources table...');
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*');

    if (sourcesError) throw sourcesError;
    console.log(`Found ${sources?.length || 0} sources:`);
    sources?.forEach(source => {
      console.log(`- ${source.name} (${source.enabled ? 'enabled' : 'disabled'})`);
      console.log(`  Last scraped: ${source.last_scraped_at || 'never'}\n`);
    });

    // Test articles table
    console.log('\n📰 Checking articles table...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        *,
        sources (name)
      `)
      .order('published_at', { ascending: false });

    if (articlesError) throw articlesError;
    console.log(`Found ${articles?.length || 0} articles:`);
    articles?.forEach(article => {
      console.log(`- ${article.title}`);
      console.log(`  Source: ${article.sources?.name}`);
      console.log(`  Published: ${article.published_at || 'unknown'}`);
      console.log(`  Has content: ${!!article.rewritten_content}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

testDatabase();