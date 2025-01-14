from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime
from playwright.sync_api import sync_playwright, Page, Browser
import json
import logging
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class ContentBlock:
    type: str  # 'text', 'image', 'header', 'quote', 'list'
    content: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ScrapedArticle:
    url: str
    title: str
    meta_description: str
    original_content: str
    processed_content: str
    structured_content: List[ContentBlock]
    main_image: Dict[str, str]
    author: str
    published_at: datetime
    tags: List[str]
    source_id: str

class BaseScraper:
    def __init__(self, base_url: str, source_id: str):
        self.base_url = base_url
        self.source_id = source_id
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.context = None
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        self.logger = logging.getLogger(__name__)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def start(self):
        """Initialize the browser and configure settings"""
        try:
            self.playwright = sync_playwright().start()
            browser_args = [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--no-zygote',
                '--single-process',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
            
            # Configure Chromium options for reliability
            self.browser = self.playwright.chromium.launch(
                headless=True,
                args=browser_args,
                ignore_default_args=['--enable-automation']
            )
            
            # Configure browser context with common headers
            self.context = self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                }
            )
            
            self.page = self.context.new_page()
            self.page.set_default_timeout(60000)  # Increase timeout to 60 seconds
            self.page.set_default_navigation_timeout(60000)  # Increase navigation timeout to 60 seconds
            
            # Disable loading images and other resources to speed up
            self.context.route("**/*.{png,jpg,jpeg,webp,gif,css,woff2}", lambda route: route.abort())
            
        except Exception as e:
            self.logger.error(f"Error starting browser: {str(e)}")
            self.close()
            raise

    def extract_structured_content(self, article_element) -> List[ContentBlock]:
        """Extract content into structured blocks"""
        blocks = []

        # Extract text blocks
        for p in article_element.query_selector_all('p'):
            text = p.text_content().strip()
            if text:
                blocks.append(ContentBlock(
                    type='text',
                    content=text
                ))

        # Extract headers
        for h in article_element.query_selector_all('h1, h2, h3, h4, h5, h6'):
            blocks.append(ContentBlock(
                type='header',
                content=h.text_content().strip(),
                metadata={'level': int(h.tag_name[1])}
            ))

        # Extract images
        for img in article_element.query_selector_all('img'):
            blocks.append(ContentBlock(
                type='image',
                content=img.get_attribute('src') or '',
                metadata={
                    'alt': img.get_attribute('alt') or '',
                    'caption': img.get_attribute('title')
                }
            ))

        # Extract quotes
        for quote in article_element.query_selector_all('blockquote'):
            blocks.append(ContentBlock(
                type='quote',
                content=quote.text_content().strip(),
                metadata={
                    'source': quote.get_attribute('cite')
                }
            ))

        return blocks

    def process_content(self, blocks: List[ContentBlock]) -> str:
        """Convert structured content blocks to formatted text"""
        processed = []
        for block in blocks:
            if block.type == 'header':
                level = block.metadata.get('level', 1) if block.metadata else 1
                processed.append(f"{'#' * level} {block.content}")
            elif block.type == 'text':
                processed.append(block.content)
            elif block.type == 'quote':
                processed.append(f"> {block.content}")
            elif block.type == 'image':
                alt = block.metadata.get('alt', 'No description') if block.metadata else 'No description'
                caption = block.metadata.get('caption', '') if block.metadata else ''
                processed.append(f"[Image: {alt}]{f' ({caption})' if caption else ''}")

        return '\n\n'.join(processed)

    def save_article(self, article: ScrapedArticle) -> Dict[str, Any]:
        """Save or update article in Supabase"""
        article_data = {
            'url': article.url,
            'title': article.title,
            'meta_description': article.meta_description,
            'original_content': article.original_content,
            'transformed_content': article.processed_content,
            'structured_content': json.dumps([{
                'type': block.type,
                'content': block.content,
                'metadata': block.metadata
            } for block in article.structured_content]),
            'image_url': article.main_image.get('url', ''),
            'author': article.author,
            'published_at': article.published_at,
            'source_id': self.source_id,
            'scraping_status': 'completed',
            'last_scraped_at': datetime.now().isoformat()
        }

        result = self.supabase.table('articles').upsert(article_data).execute()
        return result.data

    def close(self):
        """Clean up resources"""
        if self.page:
            try:
                self.page.close()
            except:
                pass
        if self.context:
            try:
                self.context.close()
            except:
                pass
        if self.browser:
            try:
                self.browser.close()
            except:
                pass
        if self.playwright:
            try:
                self.playwright.stop()
            except:
                pass