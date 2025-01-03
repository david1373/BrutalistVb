import axios from 'axios';
import * as cheerio from 'cheerio';
import { SCRAPER_CONFIG } from './config';
import { SourceKey } from './types';
import { logScraperInfo, logScraperError } from './logger';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return cheerio.load(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function scrapeArticles(sourceKey: SourceKey) {
  const source = SCRAPER_CONFIG.sources[sourceKey];
  const articles = [];

  try {
    logScraperInfo(`Starting scrape for ${source.name}`);
    
    const $ = await fetchPage(source.url);
    const articleElements = $(source.selectors.articleList);
    
    for (let i = 0; i < Math.min(articleElements.length, SCRAPER_CONFIG.articlesPerPage); i++) {
      try {
        const element = articleElements.eq(i);
        const url = element.find(source.selectors.link).attr('href');
        
        if (!url) continue;

        const title = element.find(source.selectors.title).text().trim();
        const imageUrl = element.find(source.selectors.image).attr('src');
        const date = element.find(source.selectors.date).attr('datetime');

        // Get article content
        const $article = await fetchPage(url);
        const content = $article(source.selectors.content)
          .clone()    // Create a clone to safely remove elements
          .children('script, style, iframe') // Remove unwanted elements
          .remove()
          .end()      // Go back to content element
          .text()
          .trim();

        articles.push({
          title,
          url,
          image_url: imageUrl || null,
          author: source.name,
          published_at: date || new Date().toISOString(),
          original_content: content,
          category: 'Architecture'
        });

        await delay(SCRAPER_CONFIG.rateLimitMs);
      } catch (error) {
        logScraperError(error as Error, { phase: 'article-processing' });
      }
    }

    return articles;
  } catch (error) {
    logScraperError(error as Error, { source: source.name });
    throw error;
  }
}