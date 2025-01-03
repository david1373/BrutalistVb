import type { Page } from 'puppeteer';
import type { ArticleData } from '../../types/article';

export async function scrapeDezeen(page: Page): Promise<ArticleData[]> {
  await page.goto('https://www.dezeen.com/architecture/', {
    waitUntil: 'networkidle0'
  });

  return page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article.dezeen-article'));
    
    return articles.map(article => ({
      title: article.querySelector('h3')?.textContent?.trim() || '',
      url: article.querySelector('a')?.href || '',
      image_url: article.querySelector('img')?.src || '',
      author: article.querySelector('.author-name')?.textContent?.trim() || '',
      published_at: article.querySelector('time')?.getAttribute('datetime') || '',
      category: 'Architecture'
    }));
  });
}