export async function checkSupabaseConnection(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('count');
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function printDiagnostics(results: { success: boolean, error?: string }) {
  if (results.success) {
    console.log('✓ Supabase connection successful');
  } else {
    console.error('✗ Supabase connection failed');
    console.error('Error:', results.error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify your .env file contains correct credentials');
    console.log('2. Ensure your Supabase project is running');
    console.log('3. Check if your IP is allowed in Supabase dashboard');
  }
}