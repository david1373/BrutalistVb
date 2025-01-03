export function logScrapingStart(source: string) {
  console.log(`\n📥 Starting to scrape ${source}...`);
}

export function logScrapingResults(source: string, count: number) {
  console.log(`✅ Successfully processed ${count} articles from ${source}`);
}

export function logError(message: string, error: unknown) {
  console.error(`❌ ${message}:`, error instanceof Error ? error.message : 'Unknown error');
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
}