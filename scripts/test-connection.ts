import { supabase } from '../src/lib/supabase';

async function testConnection() {
  try {
    const { data, error } = await supabase.from('articles').select('count').single();
    
    if (error) {
      console.error('Connection error:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Articles count:', data.count);
  } catch (err) {
    console.error('Error:', err);
  }
}

testConnection();
