import { ScraperResponse } from '../types/scraper';

const API_BASE = '/api';

class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new APIError(
      errorData.error || 'API request failed',
      response.status,
      errorData
    );
  }
  return response.json();
}

export async function testScraper(): Promise<ScraperResponse> {
  try {
    const response = await fetch(`${API_BASE}/scraper/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('API error:', error);
    throw new APIError(
      'API server is not responding',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}