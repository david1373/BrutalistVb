from typing import List, Dict, Any, Optional
from datetime import datetime
from scraper.base_scraper import BaseScraper, ScrapedArticle, ContentBlock
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup

class MetropolisScraper(BaseScraper):
    def __init__(self, source_id: str):
        super().__init__('https://metropolismag.com/projects/', source_id)
        self.logger = logging.getLogger(__name__)

    def get_article_urls(self, page: int = 1) -> List[Dict[str, str]]:
        """Get all article URLs and titles from a page"""
        try:
            # Navigate to the projects page and get all content at once
            url = f"{self.base_url}page/{page}/" if page > 1 else self.base_url
            self.logger.info(f"Navigating to: {url}")
            
            response = self.page.goto(url)
            if not response.ok:
                raise ValueError(f"Failed to load page: {response.status}")
                
            self.page.wait_for_selector('main')
            content = self.page.content()
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find all article entries
            articles = []
            seen_urls = set()
            
            # Look for article elements
            for article in soup.find_all(['article']):
                try:
                    # Find title and link
                    title_link = article.find(['h2', 'h3']).\
                        find('a') if article.find(['h2', 'h3']) else None
                        
                    if not title_link:
                        continue
                        
                    href = title_link.get('href')
                    title = title_link.get_text(strip=True)
                    
                    if not href or not title:
                        continue
                        
                    if href not in seen_urls:
                        articles.append({
                            'url': href,
                            'title': title,
                            'html': str(article)  # Store the HTML for later
                        })
                        seen_urls.add(href)
                        
                except Exception as e:
                    self.logger.error(f"Error processing article element: {str(e)}")
                    continue
                    
            self.logger.info(f"Found {len(articles)} unique articles")
            return articles

        except Exception as e:
            self.logger.error(f"Error fetching article list: {str(e)}")
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