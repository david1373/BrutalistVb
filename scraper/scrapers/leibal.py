from bs4 import BeautifulSoup
from scraper.scrapers.utils import extract_date
from scraper.logger import get_logger
from playwright.sync_api import sync_playwright
import time

logger = get_logger(__name__)

def scrape_leibal():
    """Scrape articles from Leibal."""
    BASE_URL = "https://leibal.com/category/architecture/"
    articles = []
    
    logger.info(f"Starting to scrape {BASE_URL}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        try:
            # Set viewport size
            page.set_viewport_size({"width": 1280, "height": 800})
            
            # Navigate to the page
            page.goto(BASE_URL, wait_until='networkidle')
            
            # Wait for content to load and scroll to trigger lazy loading
            page.wait_for_selector('.main__content', timeout=10000)
            for _ in range(3):
                page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                time.sleep(2)
            
            # Get page content
            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Try to find article elements
            article_elements = soup.select('.post-card') or \
                             soup.select('.main__content article') or \
                             soup.select('article.type-post')
            
            logger.info(f"Found {len(article_elements)} potential articles")
            
            for article in article_elements:
                try:
                    # Extract article data
                    title_elem = article.select_one('.entry-title') or \
                                article.select_one('h2') or \
                                article.select_one('h1')
                    link = article.select_one('a[href*="/architecture/"]')
                    image = article.select_one('img')
                    
                    if not (title_elem and link):
                        logger.warning("Skipping article - missing title or link")
                        continue
                    
                    article_url = link['href']
                    article_title = title_elem.get_text(strip=True)
                    
                    logger.info(f"Processing article: {article_title}")
                    
                    # Navigate to article page
                    page.goto(article_url, wait_until='networkidle')
                    page.wait_for_selector('.entry-content', timeout=10000)
                    article_content = page.content()
                    article_soup = BeautifulSoup(article_content, 'html.parser')
                    
                    # Extract content
                    content_div = article_soup.select_one('.entry-content')
                    content = ""
                    if content_div:
                        paragraphs = content_div.find_all(['p', 'h2', 'h3', 'h4'])
                        content = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
                    
                    # Extract date
                    date_elem = article_soup.select_one('.entry-date') or \
                               article_soup.select_one('time')
                    
                    articles.append({
                        "source": "Leibal",
                        "title": article_title,
                        "url": article_url,
                        "image_url": image['src'] if image and 'src' in image.attrs else None,
                        "author": "Leibal",
                        "published_at": extract_date(date_elem.get_text()) if date_elem else None,
                        "content": content,
                        "category": "Architecture"
                    })
                    
                    logger.info(f"Successfully processed article: {article_title}")
                    time.sleep(1)  # Be nice to their server
                    
                except Exception as e:
                    logger.error(f"Error processing Leibal article: {str(e)}")
                    continue
            
            browser.close()
            
        except Exception as e:
            logger.error(f"Error scraping Leibal: {str(e)}")
            browser.close()
    
    logger.info(f"Finished scraping Leibal. Found {len(articles)} articles")
    return articles