from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeout
import time

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com', source_id)
        self.logger = logging.getLogger(__name__)

    def get_article_urls(self, page: int = 1) -> List[Dict[str, str]]:
        """Get all article URLs and titles from a page"""
        try:
            # Navigate to the page
            url = f"{self.base_url}/page/{page}" if page > 1 else self.base_url
            self.logger.info(f"Navigating to: {url}")
            
            # Navigate and wait for content
            self.page.goto(url)
            self.page.wait_for_selector('main')
            
            # First try to find links using modern layout selectors
            selectors = [
                'article a[href]',
                '.article-card a[href]',
                '.post-card a[href]',
                'main a[href]'
            ]
            
            articles = []
            for selector in selectors:
                self.logger.info(f"Trying selector: {selector}")
                links = self.page.query_selector_all(selector)
                self.logger.info(f"Found {len(links)} links with selector {selector}")
                
                for link in links:
                    try:
                        href = link.get_attribute('href')
                        if not href:
                            continue
                            
                        # Skip certain URLs
                        if any(skip in href for skip in ['/jobs', '/issues/']):
                            continue
                        if href in ['/', '/projects/', '/profiles/', '/viewpoints/', '/products/']:
                            continue
                            
                        # Get title from link or nearest heading
                        title = link.text_content().strip()
                        if not title:
                            heading = link.query_selector('h2, h3, h4') or link
                            title = heading.text_content().strip()
                            
                        if href and title:
                            articles.append({
                                'url': href if href.startswith('http') else f"{self.base_url}{href}",
                                'title': title
                            })
                    except Exception as e:
                        self.logger.error(f"Error processing link: {str(e)}")
                        continue
                        
                if articles:
                    break
            
            # Log all found URLs for debugging
            self.logger.info("Found articles:")
            for article in articles:
                self.logger.info(f"- {article['title']}: {article['url']}")
            
            return articles

        except Exception as e:
            self.logger.error(f"Error fetching article list: {str(e)}")
            import traceback
            self.logger.error(traceback.format_exc())
            return []

    def scrape_article(self, article_info: Dict[str, str]) -> Optional[ScrapedArticle]:
        """Scrape a single article"""
        try:
            url = article_info['url']
            self.logger.info(f"Attempting to scrape article: {article_info['title']} at {url}")
            
            # Navigate to article
            self.page.goto(url)
            self.page.wait_for_selector('article')

            # Get article content
            article_element = self.page.query_selector('article')
            if not article_element:
                raise ValueError("Could not find article content")

            # Extract content
            original_content = article_element.inner_html()
            structured_content = self.extract_structured_content(article_element)
            processed_content = self.process_content(structured_content)

            # Extract meta information
            meta_info = {
                'title': article_info['title'],
                'meta_description': '',
                'author': 'Unknown',
                'published_at': datetime.now().isoformat(),
                'tags': []
            }
            
            # Try to get meta description
            meta_desc = self.page.query_selector('meta[name="description"]')
            if meta_desc:
                meta_info['meta_description'] = meta_desc.get_attribute('content') or ''
            
            # Try to get author
            author = self.page.query_selector('.author-name')
            if author:
                meta_info['author'] = author.text_content()
                
            # Try to get date
            time_elem = self.page.query_selector('time')
            if time_elem:
                meta_info['published_at'] = time_elem.get_attribute('datetime') or datetime.now().isoformat()
                
            # Try to get tags
            tags = self.page.query_selector_all('.tags a')
            if tags:
                meta_info['tags'] = [tag.text_content() for tag in tags if tag]

            # Get main image
            main_image = {
                'url': '',
                'alt': '',
                'caption': ''
            }
            
            img_selectors = [
                'img.wp-post-image',
                '.post-thumbnail img',
                'article img'
            ]
            
            for selector in img_selectors:
                img = self.page.query_selector(selector)
                if img:
                    main_image = {
                        'url': img.get_attribute('src') or '',
                        'alt': img.get_attribute('alt') or '',
                        'caption': img.get_attribute('title') or ''
                    }
                    break
            
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
            self.logger.error(f"Error scraping article {article_info['title']}: {str(e)}")
            return None

    def scrape_category(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape articles from Metropolis Magazine"""
        results = []
        
        for page in range(1, max_pages + 1):
            try:
                articles = self.get_article_urls(page)
                self.logger.info(f"Found {len(articles)} articles on page {page}")

                for article in articles:
                    try:
                        # Check if article already exists and needs updating
                        existing = self.supabase.table('articles')\
                            .select('id, last_scraped_at')\
                            .eq('url', article['url'])\
                            .single()\
                            .execute()

                        if existing.data:
                            last_scraped = datetime.fromisoformat(existing.data['last_scraped_at'].replace('Z', '+00:00'))
                            if (datetime.now() - last_scraped).days < 7:
                                self.logger.info(f"Skipping recently scraped article: {article['title']}")
                                continue

                        scraped = self.scrape_article(article)
                        if scraped:
                            result = self.save_article(scraped)
                            results.append(result)
                            self.logger.info(f"Successfully scraped and saved: {article['title']}")
                            
                            # Add a small delay between articles
                            time.sleep(2)

                    except Exception as e:
                        self.logger.error(f"Error processing article {article['title']}: {str(e)}")
                        continue

            except Exception as e:
                self.logger.error(f"Error processing page {page}: {str(e)}")
                continue

        return results