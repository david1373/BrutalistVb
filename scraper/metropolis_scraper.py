from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from urllib.parse import urljoin, urlparse
import requests
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com', source_id)
        self.logger = logging.getLogger(__name__)

    def _clean_url(self, url: str) -> str:
        """Clean and normalize URL"""
        if not url:
            return ''
        # Handle both relative and absolute URLs
        if not url.startswith(('http://', 'https://')):
            return urljoin(self.base_url, url)
        return url

    def get_article_urls(self, page: int = 1) -> List[str]:
        """Get all article URLs from a page using requests instead of Playwright"""
        try:
            # First make a request to the main page
            url = urljoin(self.base_url, f'page/{page}' if page > 1 else '')
            self.logger.info(f"Requesting: {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Parse the page with BeautifulSoup
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Find all article links
            urls = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = self._clean_url(href)
                
                # Skip non-article URLs
                if not full_url.startswith(self.base_url):
                    continue
                    
                parsed = urlparse(full_url)
                path = parsed.path
                
                # Skip category pages and other non-article URLs
                if path in ['/projects/', '/profiles/', '/viewpoints/', '/products/']:
                    continue
                if '/jobs' in path or '/issues/' in path:
                    continue
                if any(section in path for section in ['/projects/', '/profiles/', '/viewpoints/', '/products/']):
                    urls.append(full_url)
            
            return list(set(urls))

        except Exception as e:
            self.logger.error(f"Error fetching article list: {str(e)}")
            return []

    def scrape_article(self, url: str) -> Optional[ScrapedArticle]:
        """Scrape a single article using both requests and Playwright"""
        try:
            # First check if the URL is accessible with requests
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
            response = requests.head(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # If accessible, use Playwright for detailed scraping
            self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            self.logger.info(f"Successfully navigated to: {url}")
            
            # Wait for main content
            self.page.wait_for_selector('article', timeout=10000)

            # Get article content
            article_element = self.page.query_selector('article')
            if not article_element:
                raise ValueError("Could not find article content")

            # Extract content
            original_content = article_element.inner_html()
            structured_content = self.extract_structured_content(article_element)
            processed_content = self.process_content(structured_content)

            # Extract meta information with robust error handling
            try:
                meta_info = self.extract_meta_info()
            except Exception as e:
                self.logger.warning(f"Error extracting meta info: {str(e)}")
                meta_info = {
                    'title': self.page.title() or 'Untitled',
                    'meta_description': '',
                    'author': 'Unknown',
                    'published_at': datetime.now().isoformat(),
                    'tags': []
                }

            # Get main image
            main_image = {
                'url': '',
                'alt': '',
                'caption': ''
            }
            try:
                selectors = ['img.wp-post-image', '.post-thumbnail img', 'article img']
                for selector in selectors:
                    img_element = article_element.query_selector(selector)
                    if img_element:
                        main_image = {
                            'url': self._clean_url(img_element.get_attribute('src') or ''),
                            'alt': img_element.get_attribute('alt') or '',
                            'caption': img_element.get_attribute('title') or ''
                        }
                        break
            except Exception as e:
                self.logger.warning(f"Error extracting main image: {str(e)}")

            return ScrapedArticle(
                url=url,
                title=meta_info['title'],
                meta_description=meta_info['meta_description'],
                original_content=original_content,
                processed_content=processed_content,
                structured_content=structured_content,
                main_image=main_image,
                author=meta_info['author'],
                published_at=datetime.fromisoformat(meta_info['published_at'].replace('Z', '+00:00')),
                tags=meta_info['tags'],
                source_id=self.source_id
            )

        except Exception as e:
            self.logger.error(f"Error scraping article {url}: {str(e)}")
            return None

    def scrape_category(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape articles from Metropolis Magazine"""
        results = []
        
        for page in range(1, max_pages + 1):
            try:
                urls = self.get_article_urls(page)
                self.logger.info(f"Found {len(urls)} articles on page {page}")

                for url in urls:
                    try:
                        # Check if article already exists and needs updating
                        existing = self.supabase.table('articles')\
                            .select('id, last_scraped_at')\
                            .eq('url', url)\
                            .single()\
                            .execute()

                        if existing.data:
                            last_scraped = datetime.fromisoformat(existing.data['last_scraped_at'].replace('Z', '+00:00'))
                            if (datetime.now() - last_scraped).days < 7:
                                self.logger.info(f"Skipping recently scraped article: {url}")
                                continue

                        article = self.scrape_article(url)
                        if article:
                            result = self.save_article(article)
                            results.append(result)
                            self.logger.info(f"Successfully scraped and saved: {url}")

                    except Exception as e:
                        self.logger.error(f"Error processing article {url}: {str(e)}")
                        continue

            except Exception as e:
                self.logger.error(f"Error processing page {page}: {str(e)}")
                continue

        return results