import { Page, ElementHandle } from 'playwright';
import { ScrapedArticle, ScraperSource, ScraperError } from './types';
import { logScraperInfo, logScraperError } from './logger';

export async function extractArticleData(
  page: Page, 
  element: ElementHandle,
  source: ScraperSource
): Promise<ScrapedArticle> {
  try {
    // Get article URL first as it's required
    const linkElement = await element.$(source.selectors.link);
    const url = await linkElement?.getAttribute('href');
    if (!url) {
      throw new Error('No URL found for article');
    }

    logScraperInfo(`Extracting data for article: ${url}`);

    // Get basic article data
    const titleElement = await element.$(source.selectors.title);
    const title = await titleElement?.textContent() || '';

    const imageElement = await element.$(source.selectors.image);
    const imageUrl = await imageElement?.getAttribute('src');

    const authorElement = await element.$(source.selectors.author);
    const author = await authorElement?.textContent();

    const dateElement = await element.$(source.selectors.date);
    const publishedAt = await dateElement?.getAttribute('datetime');

    // Get article content
    logScraperInfo('Fetching article content...');
    await page.goto(url, { waitUntil: 'networkidle' });
    const contentElement = await page.$(source.selectors.content);
    const content = await contentElement?.textContent() || '';

    return {
      title: title?.trim() || '',
      url,
      image_url: imageUrl || null,
      author: author?.trim() || null,
      published_at: publishedAt || null,
      original_content: content?.trim() || '',
      category: 'Architecture'
    };
  } catch (error) {
    const scraperError = error as ScraperError;
    scraperError.phase = 'extraction';
    scraperError.source = source.name;
    logScraperError(scraperError, { source: source.name });
    throw scraperError;
  }
}