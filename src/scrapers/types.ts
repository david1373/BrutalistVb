export interface ArticleData {
  title: string;
  url: string;
  image_url?: string;
  author?: string;
  published_at?: string;
  content?: string;
  category: string;
}

export interface Scraper {
  scrape: (page: any) => Promise<ArticleData[]>;
}

export type Category = 'Architecture' | 'Interiors' | 'Sustainability' | 'Interviews';