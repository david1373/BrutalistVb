import { chromium, Browser, BrowserContext } from 'playwright';
import { SCRAPER_CONFIG } from './config';

export async function createBrowserContext(): Promise<BrowserContext> {
  const browser: Browser = await chromium.launch({
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: SCRAPER_CONFIG.userAgents[Math.floor(Math.random() * SCRAPER_CONFIG.userAgents.length)],
    geolocation: SCRAPER_CONFIG.geolocations[Math.floor(Math.random() * SCRAPER_CONFIG.geolocations.length)],
    permissions: ['geolocation'],
    viewport: { width: 1280, height: 720 }
  });

  // Enable request interception for rate limiting
  await context.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 1000 / SCRAPER_CONFIG.rateLimit.requests));
    await route.continue();
  });

  return context;
}