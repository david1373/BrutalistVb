from bs4 import BeautifulSoup
from scraper.scrapers.utils import get_page, extract_date
from scraper.logger import get_logger
from playwright.sync_api import sync_playwright
import time

logger = get_logger(__name__)

def get_page_with_js(url):
    """Get page content using Playwright to handle JavaScript."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            # Add headers to appear more like a regular browser
            page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            })
            
            # Navigate and wait for content
            page.goto(url)
            time.sleep(5)  # Give time for dynamic content to load
            
            # Try different selectors
            selectors = [
                'article',
                '.item',
                '.post',
                '#primary article',
                '.site-main article'
            ]
            
            for selector in selectors:
                try:
                    logger.info(f"Trying selector: {selector}")
                    element = page.wait_for_selector(selector, timeout=5000)
                    if element:
                        logger.info(f"Found elements with selector: {selector}")
                        break
                except Exception:
                    continue
            
            content = page.content()
            browser.close()
            return BeautifulSoup(content, 'html.parser')
            
        except Exception as e:
            logger.error(f"Error loading page with Playwright: {str(e)}")
            browser.close()
            return None

def scrape_leibal():
    """Scrape articles from Leibal."""
    BASE_URL = "https://leibal.com/category/architecture/"
    articles = []
    
    try:
        logger.info(f"Starting to scrape {BASE_URL}")
        soup = get_page_with_js(BASE_URL)
        if not soup:
            logger.error("Failed to get page content")
            return articles
        
        # Try different article selectors
        selectors = [
            'article',
            '.item',
            '.post',
            '#primary article',
            '.site-main article'
        ]
        
        article_elements = []
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                logger.info(f"Found {len(elements)} articles with selector: {selector}")
                article_elements = elements
                break
        
        logger.info(f"Found {len(article_elements)} potential articles")
        
        for article in article_elements:
            try:
                # Extract article data
                link = article.select_one("a")
                title = article.select_one("h1") or \
                        article.select_one("h2") or \
                        article.select_one(".entry-title")
                image = article.select_one("img")
                
                if not (link and title):
                    logger.warning("Skipping article - missing link or title")
                    continue
                
                article_title = title.get_text(strip=True)
                logger.info(f"Processing article: {article_title}")
                
                # Get full article content
                article_url = link.get("href")
                if not article_url.startswith("http"):
                    article_url = f"https://leibal.com{article_url}"
                
                # Get full article content
                article_soup = get_page_with_js(article_url)
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".entry-content") or \
                                 article_soup.select_one(".post-content") or \
                                 article_soup.select_one("article")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                # Extract date
                date = article.select_one("time") or \
                       article.select_one(".entry-date") or \
                       article.select_one(".posted-on")
                
                articles.append({
                    "source": "Leibal",
                    "title": article_title,
                    "url": article_url,
                    "image_url": image["src"] if image and "src" in image.attrs else None,
                    "author": "Leibal",
                    "published_at": extract_date(date.get_text()) if date else None,
                    "content": content,
                    "category": "Architecture"
                })
                
                logger.info(f"Successfully processed article: {article_title}")
                
            except Exception as e:
                logger.error(f"Error processing Leibal article: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error scraping Leibal: {str(e)}")
        
    logger.info(f"Finished scraping Leibal. Found {len(articles)} articles")
    return articles