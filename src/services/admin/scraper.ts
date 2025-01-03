import { ScraperResult } from '../../types/scraper';

interface ScraperResponse {
  success: boolean;
  results: ScraperResult[];
  error?: string;
  timestamp: string;
}

export async function runScraper(): Promise<ScraperResponse> {
  try {
    const response = await fetch('/api/scraper/test', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || 'Failed to run scraper');
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    return {
      success: true,
      results: Array.isArray(data.results) ? data.results : [],
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Scraper error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Failed to run scraper',
      timestamp: new Date().toISOString()
    };
  }
}