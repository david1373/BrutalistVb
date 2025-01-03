import { ArticleData } from '../types';

export async function scrapePageArticles(
  page: any,
  selector: string,
  extractData: (element: Element) => Partial<ArticleData> | null
): Promise<ArticleData[]> {
  return page.evaluate(
    ({ selector, category }) => {
      const articles: ArticleData[] = [];
      const elements = document.querySelectorAll(selector);

      elements.forEach((el) => {
        const title = el.querySelector('h3, h2')?.textContent?.trim();
        const url = el.querySelector('a')?.href;
        const image = el.querySelector('img');
        const author = el.querySelector('.author, .author-name')?.textContent?.trim();
        const dateEl = el.querySelector('time, .published, .entry-date');

        if (title && url) {
          articles.push({
            title,
            url,
            image_url: image?.src,
            author,
            published_at: dateEl?.getAttribute('datetime'),
            category
          });
        }
      });

      return articles;
    },
    { selector }
  );
}