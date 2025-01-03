export interface ScraperResult {
  source: string;
  articlesFound: number;
  error?: string;
  sampleArticle?: {
    title: string;
    url: string;
  };
}

export interface ScraperResponse {
  success: boolean;
  results: ScraperResult[];
  timestamp: string;
  error?: string;
}