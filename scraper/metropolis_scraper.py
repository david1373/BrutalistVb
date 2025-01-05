from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeout

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com', source_id)
        self.logger = logging.getLogger(__name__)

    def get_article_urls(self, page: int = 1) -> List[str]:
        """Get all article URLs from a category page"""
        try:
            # Metropolis uses /page/{page} structure for pagination
            url = f"{self.base_url}/page/{page}" if page > 1 else self.base_url
            self.page.goto(url, wait_until='networkidle')
            
            # Wait for article links - we'll need to adjust these selectors
            self.page.wait_for_selector('article a')
            
            # Extract URLs - we'll refine these selectors based on the site's structure
            links = self.page.query_selector_all('article a')
            urls = [link.get_attribute('href') for link in links]
            
            # Filter and deduplicate
            return list(set([url for url in urls if url and url.startswith(self.base_url)]))

        except PlaywrightTimeout:
            self.logger.error(f"Timeout while fetching article list from page {page}")
            return []
        except Exception as e:
            self.logger.error(f"Error fetching article list: {str(e)}")
            return []

    def scrape_article(self, url: str) -> Optional[ScrapedArticle]:
        """Scrape a single article"""
        try:
            self.page.goto(url, wait_until='networkidle')
            
            # We'll need to adjust these selectors based on Metropolis's HTML structure
            article_element = self.page.query_selector('article')
            if not article_element:
                raise ValueError("Could not find article content")

            # Extract content
            original_content = article_element.inner_html()
            structured_content = self.extract_structured_content(article_element)
            processed_content = self.process_content(structured_content)

            # Extract meta information
            meta_info = self.extract_meta_info()

            # Get main image - adjust selector as needed
            main_image = {
                'url': '',
                'alt': '',
                'caption': ''
            }
            img_element = article_element.query_selector('img')
            if img_element:
                main_image = {
                    'url': img_element.get_attribute('src') or '',
                    'alt': img_element.get_attribute('alt') or '',
                    'caption': img_element.get_attribute('title') or ''
                }

            # Create article object
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