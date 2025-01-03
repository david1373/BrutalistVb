import { supabase } from './lib/supabase';

async function testSupabase() {
  console.log('Testing Supabase connection...');

  try {
    // Test sources table
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*');

    if (sourcesError) throw sourcesError;
    console.log('Sources found:', sources?.length || 0);

    // Test articles table
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*');

    if (articlesError) throw articlesError;
    console.log('Articles found:', articles?.length || 0);

    console.log('Connection test successful!');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testSupabase();