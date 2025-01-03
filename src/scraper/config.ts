export const SCRAPER_CONFIG = {
  maxConcurrentPages: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimit: {
    requests: 10,
    perSeconds: 60
  },
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ],
  geolocations: [
    { latitude: 40.7128, longitude: -74.0060 }, // New York
    { latitude: 51.5074, longitude: -0.1278 }    // London
  ],
  imageProcessing: {
    maxWidth: 1200,
    quality: 80,
    formats: ['webp', 'jpg']
  }
};