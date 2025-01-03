import { ArticleData, Scraper } from './types';
import { DEZEEN_URLS } from './constants/urls';
import { scrapePageArticles } from './utils/scrapeHelpers';
import { scrapeArticleContent } from './utils/contentScraper';

export const dezeenScraper: Scraper = {
  urls: DEZEEN_URLS,
  
  async scrape(page) {
    const articles: ArticleData[] = [];
    console.log('Starting Dezeen scraper...');

    for (const [category, url] of Object.entries(this.urls)) {
      console.log(`Scraping ${category} at ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        console.log('Page loaded');
        
        const pageArticles = await scrapePageArticles(
          page,
          'article.dezeen-article',
          async (el) => {
            const articleUrl = el.querySelector('a')?.href;
            let content = '';
            
            if (articleUrl) {
              content = await scrapeArticleContent(page, articleUrl);
            }
            
            return {
              title: el.querySelector('h3')?.textContent?.trim(),
              url: articleUrl,
              image_url: el.querySelector('img')?.src,
              author: el.querySelector('.author-name')?.textContent?.trim(),
              published_at: el.querySelector('time')?.getAttribute('datetime'),
              original_content: content,
              category
            };
          }
        );

        console.log(`Found ${pageArticles.length} articles in ${category}`);
        articles.push(...pageArticles);
        
      } catch (error) {
        console.error(`Error scraping ${category}:`, error);
      }
    }
    
    return articles;
  }
};