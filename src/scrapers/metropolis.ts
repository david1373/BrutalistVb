import { ArticleData, Scraper } from './types';
import { METROPOLIS_URLS } from './constants/urls';
import { scrapePageArticles } from './utils/scrapeHelpers';
import { scrapeArticleContent } from './utils/contentScraper';

export const metropolisScraper: Scraper = {
  async scrape(page) {
    const articles: ArticleData[] = [];

    for (const [category, url] of Object.entries(METROPOLIS_URLS)) {
      console.log(`Scraping Metropolis ${category}...`);
      await page.goto(url);
      
      const pageArticles = await scrapePageArticles(
        page,
        'article.article',
        async (el) => {
          const articleUrl = el.querySelector('a')?.href;
          let content = '';
          
          if (articleUrl) {
            content = await scrapeArticleContent(page, articleUrl);
          }
          
          return {
            title: el.querySelector('h2')?.textContent?.trim(),
            url: articleUrl,
            image_url: el.querySelector('img')?.src,
            author: el.querySelector('.author')?.textContent?.trim(),
            published_at: el.querySelector('.published')?.getAttribute('datetime'),
            original_content: content
          };
        }
      );

      articles.push(...pageArticles);
    }
    
    return articles;
  }
};