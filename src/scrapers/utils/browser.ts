import { chromium, Browser, BrowserContext, Page } from 'playwright';

export async function setupBrowser(): Promise<Browser> {
  return chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
}

export async function createBrowserContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
}

export async function createPage(context: BrowserContext): Promise<Page> {
  return context.newPage();
}