import { Page } from 'playwright';
import { CONTENT_SELECTORS } from './selectors';

export async function scrapeArticleContent(page: Page, url: string): Promise<string> {
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Extract the article content using site-specific selectors
  const content = await page.evaluate((selectors) => {
    // Try all content selectors
    for (const site of Object.values(selectors)) {
      const contentEl = document.querySelector(site.content);
      if (contentEl) {
        // Remove unwanted elements
        contentEl.querySelectorAll('script, style, iframe, .advertisement, .social-share, .related-posts')
          .forEach(el => el.remove());
          
        return contentEl.textContent?.trim() || '';
      }
    }
    return '';
  }, CONTENT_SELECTORS);
  
  return content;
}