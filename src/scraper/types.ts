export interface Article {
  title: string;
  content: string;
  imageUrls: string[];
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
  };
}

export interface ScraperError extends Error {
  url?: string;
  retryCount?: number;
}