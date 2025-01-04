from bs4 import BeautifulSoup
from scraper.scrapers.utils import get_page, extract_date
from scraper.logger import get_logger
from playwright.sync_api import sync_playwright

logger = get_logger(__name__)

def get_page_with_js(url):
    """Get page content using Playwright to handle JavaScript."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            page.goto(url, wait_until='networkidle')
            page.wait_for_selector('.grid-item', timeout=10000)  # Wait for items to load
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
        # Use Playwright to handle JavaScript-loaded content
        soup = get_page_with_js(BASE_URL)
        if not soup:
            logger.error("Failed to get page content")
            return articles
        
        # Find all article elements
        article_elements = soup.select(".grid-item") or \
                         soup.select(".masonry-item") or \
                         soup.select(".type-post")
        
        logger.info(f"Found {len(article_elements)} potential articles")
        
        for article in article_elements:
            try:
                # Extract article data
                link = article.select_one("a") or article.find("a")
                title = article.select_one(".entry-title") or \
                        article.select_one(".post-title") or \
                        article.find("h1")
                image = article.select_one("img")
                
                if not (link and title):
                    logger.warning(f"Skipping article - missing link or title")
                    continue
                
                article_title = title.get_text(strip=True)
                logger.info(f"Processing article: {article_title}")
                
                # Get full article content
                article_url = link.get("href")
                if not article_url.startswith("http"):
                    article_url = f"https://leibal.com{article_url}"
                    
                # Get full article using Playwright
                article_soup = get_page_with_js(article_url)
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".entry-content") or \
                                 article_soup.select_one(".post-content")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                # Extract date if available
                date = article.select_one(".entry-date") or \
                       article.select_one(".post-date")
                
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