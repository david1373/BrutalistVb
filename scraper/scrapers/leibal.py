import time
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from ..logger import setup_logger

logger = setup_logger()

class RateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.last_request = 0
        self.min_interval = 60.0 / requests_per_minute

    def wait(self):
        now = time.time()
        time_since_last = now - self.last_request
        if time_since_last < self.min_interval:
            time.sleep(self.min_interval - time_since_last)
        self.last_request = time.time()

class LeibalScraper:
    def __init__(self, base_url: str = "https://leibal.com"):
        self.base_url = base_url
        self.rate_limiter = RateLimiter(requests_per_minute=10)  # Respectful rate limiting
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; BrutalistBot/1.0; +http://yourwebsite.com/bot)',
        })

    def _make_request(self, url: str) -> Optional[str]:
        """Make a rate-limited request with error handling."""
        try:
            self.rate_limiter.wait()
            response = self.session.get(url)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    def parse_article(self, url: str) -> Optional[Dict]:
        """Parse a single article page."""
        html = self._make_request(url)
        if not html:
            return None

        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract article metadata
            title = soup.find('h1', class_='entry-title').text.strip()
            content = soup.find('div', class_='entry-content')
            images = [img['src'] for img in content.find_all('img') if 'src' in img.attrs]
            
            # Extract author and date
            meta = soup.find('div', class_='entry-meta')
            author = meta.find('a', rel='author').text if meta else "Unknown"
            date_str = meta.find('time')['datetime'] if meta else None

            return {
                "source": "Leibal",
                "url": url,
                "title": title,
                "content": content.get_text(separator='\n\n'),
                "image_url": images[0] if images else None,
                "additional_images": images[1:],
                "author": author,
                "published_at": date_str,
                "tags": [tag.text for tag in soup.find_all('a', rel='tag')]
            }
        except Exception as e:
            logger.error(f"Error parsing article {url}: {str(e)}")
            return None

    def get_article_urls(self, page: int = 1) -> List[str]:
        """Get article URLs from the archive page."""
        archive_url = f"{self.base_url}/architecture/page/{page}"
        html = self._make_request(archive_url)
        if not html:
            return []

        try:
            soup = BeautifulSoup(html, 'html.parser')
            articles = soup.find_all('article')
            return [article.find('a')['href'] for article in articles if article.find('a')]
        except Exception as e:
            logger.error(f"Error getting article URLs from page {page}: {str(e)}")
            return []

    def scrape_recent_articles(self, num_pages: int = 3) -> List[Dict]:
        """Scrape recent articles from multiple pages."""
        all_articles = []
        
        for page in range(1, num_pages + 1):
            urls = self.get_article_urls(page)
            logger.info(f"Found {len(urls)} articles on page {page}")
            
            for url in urls:
                article = self.parse_article(url)
                if article:
                    all_articles.append(article)
                    logger.info(f"Successfully scraped article: {article['title']}")

        return all_articles