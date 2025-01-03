import { validateEnv } from '../src/lib/utils/validateEnv';
import { checkSupabaseConnection, printDiagnostics } from './utils/diagnostics';
import { supabaseAdmin } from '../src/lib/supabaseAdmin';

async function main() {
  try {
    // Validate environment variables
    validateEnv();
    
    // Test connection
    console.log('Testing Supabase connection...');
    const results = await checkSupabaseConnection(supabaseAdmin);
    
    // Print results and diagnostics
    printDiagnostics(results);
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('Setup error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();