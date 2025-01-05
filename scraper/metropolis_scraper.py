from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeout
import time
from urllib.parse import urljoin, urlparse

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com/projects/', source_id)
        self.logger = logging.getLogger(__name__)

    def get_article_urls(self, page: int = 1) -> List[Dict[str, str]]:
        """Get all article URLs and titles from a page"""
        try:
            # Navigate to the page with projects
            url = f"{self.base_url}page/{page}/" if page > 1 else self.base_url
            self.logger.info(f"Navigating to: {url}")
            
            # Navigate and wait for content
            self.page.goto(url)
            self.page.wait_for_selector('.page-content')
            
            # Take a screenshot for debugging
            self.page.screenshot(path='page.png')
            
            time.sleep(2)  # Allow dynamic content to load
            
            # Get all article containers
            articles = []
            article_entries = self.page.query_selector_all('.page-content article')
            
            self.logger.info(f"Found {len(article_entries)} article entries")
            
            for entry in article_entries:
                try:
                    # Get title and links
                    title_links = entry.query_selector_all('a[href]')
                    for link in title_links:
                        href = link.get_attribute('href')
                        if not href:
                            continue
                            
                        # Skip links that don't look like articles
                        if any(skip in href for skip in ['/jobs', '/issues/', 'category']):
                            continue
                        
                        # Try to get title from link or nearest heading
                        title = link.text_content().strip()
                        if not title:
                            heading = entry.query_selector('h1, h2, h3, h4')
                            if heading:
                                title = heading.text_content().strip()
                        
                        if not title or title.lower() in ['learn more', 'read more']:
                            continue
                        
                        # Build full URL if needed
                        if not href.startswith('http'):
                            href = urljoin(self.base_url, href.lstrip('/'))
                        
                        self.logger.info(f"Found article: {title} at {href}")
                        articles.append({
                            'url': href,
                            'title': title
                        })
                        break  # Take only first valid link per article
                        
                except Exception as e:
                    self.logger.error(f"Error processing article entry: {str(e)}")
                    continue
            
            # Remove duplicates while preserving order
            unique_articles = []
            seen = set()
            for article in articles:
                if article['url'] not in seen:
                    unique_articles.append(article)
                    seen.add(article['url'])
            
            self.logger.info(f"Found {len(unique_articles)} unique articles")
            for article in unique_articles:
                self.logger.info(f"Final article: {article['title']} at {article['url']}")
                
            return unique_articles

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
            response = self.page.goto(url, wait_until='domcontentloaded')
            if not response.ok:
                raise ValueError(f"Got status {response.status} when accessing article")
            
            # Allow content to load
            time.sleep(2)
            
            # Wait for content
            self.page.wait_for_selector('article', timeout=10000)

            # Get article content
            article_element = self.page.query_selector('article')
            if not article_element:
                raise ValueError("Could not find article content")

            # Get main content area
            content_area = article_element.query_selector('.entry-content')
            if not content_area:
                content_area = article_element  # Fallback to full article if no specific content area

            # Extract content
            original_content = content_area.inner_html()
            structured_content = self.extract_structured_content(content_area)
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
            author = self.page.query_selector('.author-name, .author')
            if author:
                meta_info['author'] = author.text_content().strip()
                
            # Try to get date
            time_elem = self.page.query_selector('time')
            if time_elem:
                meta_info['published_at'] = time_elem.get_attribute('datetime') or datetime.now().isoformat()
                
            # Try to get tags
            tags = self.page.query_selector_all('.tags a, .category a')
            if tags:
                meta_info['tags'] = [tag.text_content().strip() for tag in tags if tag]

            # Get main image
            main_image = {
                'url': '',
                'alt': '',
                'caption': ''
            }
            
            img_selectors = [
                '.featured-image img',
                '.entry-content img',
                'article img'
            ]
            
            for selector in img_selectors:
                img = self.page.query_selector(selector)
                if img:
                    src = img.get_attribute('src')
                    if src:
                        main_image = {
                            'url': urljoin(self.base_url, src.lstrip('/')),
                            'alt': img.get_attribute('alt') or '',
                            'caption': img.get_attribute('title') or ''
                        }
                        break
            
            # Create article object
            article = ScrapedArticle(
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
            
            self.logger.info(f"Successfully scraped article: {article.title}")
            return article

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