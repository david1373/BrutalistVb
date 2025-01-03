export function logScraperInfo(message: string, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Scraper] ${message}`, meta ? JSON.stringify(meta) : '');
}

export function logScraperError(error: Error, context: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Scraper Error]`, {
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...context
  });
}