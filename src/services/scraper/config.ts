export const SCRAPER_CONFIG = {
  articlesPerPage: 5,
  rateLimitMs: 2000,
  sources: {
    leibal: {
      name: 'Leibal',
      url: 'https://leibal.com/category/architecture/',
      selectors: {
        articleList: 'article.post',
        title: '.entry-title',
        link: '.entry-title a',
        image: '.post-thumbnail img',
        date: '.entry-date',
        content: '.entry-content',
        excerpt: '.entry-summary'
      }
    }
  }
} as const;

export type SourceKey = keyof typeof SCRAPER_CONFIG.sources;