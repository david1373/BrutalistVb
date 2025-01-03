import { ArticleData, Scraper } from './types';
import { LEIBAL_URLS } from './constants/urls';
import { scrapePageArticles } from './utils/scrapeHelpers';
import { scrapeArticleContent } from './utils/contentScraper';

export const leibalScraper: Scraper = {
  async scrape(page) {
    const articles: ArticleData[] = [];

    for (const [category, url] of Object.entries(LEIBAL_URLS)) {
      console.log(`Scraping Leibal ${category}...`);
      await page.goto(url);
      
      const pageArticles = await scrapePageArticles(
        page,
        'article.post',
        async (el) => {
          const articleUrl = el.querySelector('a')?.href;
          let content = '';
          
          if (articleUrl) {
            content = await scrapeArticleContent(page, articleUrl);
          }
          
          return {
            title: el.querySelector('.entry-title')?.textContent?.trim(),
            url: articleUrl,
            image_url: el.querySelector('img')?.src,
            published_at: el.querySelector('.entry-date')?.getAttribute('datetime'),
            original_content: content
          };
        }
      );

      articles.push(...pageArticles);
    }
    
    return articles;
  }
};