from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import time

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com/projects/', source_id)
        self.logger = logging.getLogger(__name__)

    def get_article_urls(self, page: int = 1) -> List[Dict[str, str]]:
        """Get all article URLs and titles from a page"""
        try:
            # Navigate to the projects page
            url = f"{self.base_url}page/{page}/" if page > 1 else self.base_url
            self.logger.info(f"Navigating to: {url}")
            
            # Navigate and wait for content
            response = self.page.goto(url)
            if not response.ok:
                raise ValueError(f"Failed to load page: {response.status}")
                
            # Give page time to load dynamic content
            time.sleep(5)
            
            # Save a screenshot for debugging
            self.page.screenshot(path='page_debug.png')
            
            # Get all content
            content = self.page.content()
            self.logger.info("Got page content, length: %d", len(content))
            
            # Save HTML for debugging
            with open('page_debug.html', 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Log the overall structure
            self.logger.info("Page structure:")
            for tag in soup.find_all(['header', 'main', 'article', 'div'], class_=True):
                self.logger.info(f"Found element: <{tag.name} class='{tag.get('class', [])}'>")
            
            # Find all article links using different approaches
            articles = []
            seen_urls = set()
            
            # First try to find posts directly
            post_elements = soup.find_all(['article', 'div'], class_=['post', 'article', 'entry'])
            self.logger.info(f"Found {len(post_elements)} post elements")
            
            for post in post_elements:
                try:
                    # Try multiple ways to find the title and link
                    title_elem = post.find(['h1', 'h2', 'h3', 'h4'], recursive=True)
                    if not title_elem:
                        continue
                        
                    link = title_elem.find('a') if title_elem else None
                    if not link:
                        continue
                        
                    href = link.get('href')
                    title = link.get_text(strip=True)
                    
                    if not href or not title:
                        continue
                        
                    self.logger.info(f"Found article: {title} at {href}")
                    
                    if href not in seen_urls:
                        articles.append({
                            'url': href,
                            'title': title,
                            'html': str(post)
                        })
                        seen_urls.add(href)
                        
                except Exception as e:
                    self.logger.error(f"Error processing post element: {str(e)}")
                    continue
            
            # If we didn't find articles, try a broader search
            if not articles:
                self.logger.info("No articles found with first method, trying broader search")
                links = soup.find_all('a', href=True)
                self.logger.info(f"Found {len(links)} total links")
                
                for link in links:
                    try:
                        href = link.get('href')
                        if not href or href in seen_urls:
                            continue
                            
                        # Only process links that look like articles
                        if not any(section in href for section in ['/projects/', '/profiles/', '/viewpoints/', '/products/']):
                            continue
                        if href.endswith(('/projects/', '/profiles/', '/viewpoints/', '/products/')):
                            continue
                            
                        title = link.get_text(strip=True)
                        if not title or title.lower() in ['learn more', 'read more']:
                            continue
                            
                        self.logger.info(f"Found link: {title} at {href}")
                        
                        # Get the parent article/div if possible
                        parent = link.find_parent(['article', 'div'], class_=['post', 'article', 'entry'])
                        html = str(parent) if parent else str(link)
                        
                        articles.append({
                            'url': href,
                            'title': title,
                            'html': html
                        })
                        seen_urls.add(href)
                        
                    except Exception as e:
                        self.logger.error(f"Error processing link: {str(e)}")
                        continue
            
            self.logger.info(f"Found {len(articles)} unique articles")
            for article in articles:
                self.logger.info(f"Final article: {article['title']} at {article['url']}")
                
            return articles

        except Exception as e:
            self.logger.error(f"Error fetching article list: {str(e)}")
            import traceback
            self.logger.error(traceback.format_exc())
            return []

    def scrape_article(self, article_info: Dict[str, str]) -> Optional[ScrapedArticle]:
        """Extract article content from stored HTML"""
        try:
            self.logger.info(f"Processing article: {article_info['title']}")
            
            # Parse the stored HTML
            soup = BeautifulSoup(article_info['html'], 'html.parser')
            
            # Extract basic content
            main_content = soup.get_text(strip=True)
            
            # Extract any available metadata
            meta_info = {
                'title': article_info['title'],
                'meta_description': '',
                'author': 'Unknown',
                'published_at': datetime.now().isoformat(),
                'tags': []
            }
            
            # Try to extract author if available
            author_elem = soup.find(class_=['author', 'byline'])
            if author_elem:
                meta_info['author'] = author_elem.get_text(strip=True)
            
            # Create structured content
            structured_content = []
            
            # Add title block
            structured_content.append(ContentBlock(
                type='header',
                content=article_info['title'],
                metadata={'level': 1}
            ))
            
            # Add main content block
            structured_content.append(ContentBlock(
                type='text',
                content=main_content
            ))
            
            # Extract main image if available
            main_image = {
                'url': '',
                'alt': '',
                'caption': ''
            }
            
            img = soup.find('img')
            if img:
                main_image = {
                    'url': img.get('src', ''),
                    'alt': img.get('alt', ''),
                    'caption': img.get('title', '')
                }
            
            # Create article object
            return ScrapedArticle(
                url=article_info['url'],
                title=meta_info['title'],
                meta_description=meta_info['meta_description'],
                original_content=article_info['html'],
                processed_content=main_content,
                structured_content=structured_content,
                main_image=main_image,
                author=meta_info['author'],
                published_at=datetime.fromisoformat(meta_info['published_at'].replace('Z', '+00:00')),
                tags=meta_info['tags'],
                source_id=self.source_id
            )

        except Exception as e:
            self.logger.error(f"Error processing article {article_info['title']}: {str(e)}")
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

                    except Exception as e:
                        self.logger.error(f"Error processing article {article['title']}: {str(e)}")
                        continue

            except Exception as e:
                self.logger.error(f"Error processing page {page}: {str(e)}")
                continue

        return results