import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
import time
from .leibal import LeibalScraper
from ..logger import setup_logger

logger = setup_logger()

class AsyncRateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.min_interval = 60.0 / requests_per_minute
        self._last_request_time = {}
        self._lock = asyncio.Lock()

    async def acquire(self, key: str = 'default'):
        async with self._lock:
            now = time.time()
            if key in self._last_request_time:
                time_since_last = now - self._last_request_time[key]
                if time_since_last < self.min_interval:
                    await asyncio.sleep(self.min_interval - time_since_last)
            self._last_request_time[key] = time.time()

class ParallelLeibalScraper(LeibalScraper):
    def __init__(self, base_url: str = "https://leibal.com", max_concurrent: int = 3):
        super().__init__(base_url)
        self.rate_limiter = AsyncRateLimiter(requests_per_minute=10)
        self.max_concurrent = max_concurrent
        self.seen_urls: Set[str] = set()

    async def _async_make_request(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        """Make a rate-limited async request with error handling."""
        try:
            await self.rate_limiter.acquire()
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.text()
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    async def parse_article_async(self, session: aiohttp.ClientSession, url: str) -> Optional[Dict]:
        """Asynchronously parse a single article page."""
        if url in self.seen_urls:
            return None
        
        self.seen_urls.add(url)
        html = await self._async_make_request(session, url)
        if not html:
            return None

        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract article metadata (same as synchronous version)
            title = soup.find('h1', class_='entry-title').text.strip()
            content = soup.find('div', class_='entry-content')
            images = [img['src'] for img in content.find_all('img') if 'src' in img.attrs]
            
            meta = soup.find('div', class_='entry-meta')
            author = meta.find('a', rel='author').text if meta else "Unknown"
            date_str = meta.find('time')['datetime'] if meta else None

            return {
                "source": "Leibal",
                "url": url,
                "title": title,
                "content": content.get_text(separator='\\n\\n'),
                "image_url": images[0] if images else None,
                "additional_images": images[1:],
                "author": author,
                "published_at": date_str,
                "tags": [tag.text for tag in soup.find_all('a', rel='tag')]
            }
        except Exception as e:
            logger.error(f"Error parsing article {url}: {str(e)}")
            return None

    async def get_article_urls_async(self, session: aiohttp.ClientSession, page: int = 1) -> List[str]:
        """Asynchronously get article URLs from the archive page."""
        archive_url = f"{self.base_url}/architecture/page/{page}"
        html = await self._async_make_request(session, archive_url)
        if not html:
            return []

        try:
            soup = BeautifulSoup(html, 'html.parser')
            articles = soup.find_all('article')
            return [article.find('a')['href'] for article in articles if article.find('a')]
        except Exception as e:
            logger.error(f"Error getting article URLs from page {page}: {str(e)}")
            return []

    async def scrape_articles_async(self, urls: List[str]) -> List[Dict]:
        """Scrape multiple articles concurrently with rate limiting."""
        async with aiohttp.ClientSession(headers=self.session.headers) as session:
            tasks = []
            semaphore = asyncio.Semaphore(self.max_concurrent)
            
            async def scrape_with_semaphore(url: str):
                async with semaphore:
                    return await self.parse_article_async(session, url)
            
            for url in urls:
                task = asyncio.create_task(scrape_with_semaphore(url))
                tasks.append(task)
            
            results = await asyncio.gather(*tasks)
            return [r for r in results if r is not None]

    async def scrape_recent_articles_async(self, num_pages: int = 3) -> List[Dict]:
        """Scrape recent articles from multiple pages asynchronously."""
        async with aiohttp.ClientSession(headers=self.session.headers) as session:
            # Get all URLs first
            url_tasks = [
                asyncio.create_task(self.get_article_urls_async(session, page))
                for page in range(1, num_pages + 1)
            ]
            url_lists = await asyncio.gather(*url_tasks)
            all_urls = [url for urls in url_lists for url in urls]
            
            logger.info(f"Found {len(all_urls)} articles to scrape")
            return await self.scrape_articles_async(all_urls)

def scrape_with_params(num_pages: int = 3, max_concurrent: int = 3) -> List[Dict]:
    """Helper function to run the async scraper."""
    scraper = ParallelLeibalScraper(max_concurrent=max_concurrent)
    return asyncio.run(scraper.scrape_recent_articles_async(num_pages))