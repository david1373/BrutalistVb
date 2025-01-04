from bs4 import BeautifulSoup
from scraper.scrapers.utils import get_page, extract_date
from scraper.logger import get_logger

logger = get_logger(__name__)

def scrape_leibal():
    """Scrape articles from Leibal."""
    BASE_URL = "https://leibal.com/category/architecture/"
    articles = []
    
    try:
        logger.info(f"Starting to scrape {BASE_URL}")
        soup = get_page(BASE_URL)
        if not soup:
            logger.error("Failed to get page content")
            return articles
        
        # Find all article elements
        article_elements = soup.select(".post") or \
                         soup.select("article") or \
                         soup.select(".entry")
        
        logger.info(f"Found {len(article_elements)} potential articles")
        
        for article in article_elements:
            try:
                # Extract article data
                link = article.select_one("a") or article.find("a")
                title = article.select_one("h2") or article.find("h1") or article.select_one(".entry-title")
                image = article.select_one("img")
                meta = article.select_one(".entry-meta") or article.select_one(".post-meta")
                
                if not (link and title):
                    logger.warning(f"Skipping article - missing link or title")
                    continue
                
                logger.info(f"Processing article: {title.get_text(strip=True)}")
                
                # Get full article content
                article_url = link.get("href")
                if not article_url.startswith("http"):
                    article_url = f"https://leibal.com{article_url}"
                    
                article_soup = get_page(article_url)
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".entry-content") or \
                                 article_soup.select_one(".post-content") or \
                                 article_soup.select_one(".content")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                # Extract date if available
                date = None
                if meta:
                    date_text = meta.get_text(strip=True)
                    date = extract_date(date_text)
                
                articles.append({
                    "source": "Leibal",
                    "title": title.get_text(strip=True),
                    "url": article_url,
                    "image_url": image["src"] if image and "src" in image.attrs else None,
                    "author": "Leibal",  # Leibal typically doesn't show individual authors
                    "published_at": date,
                    "content": content,
                    "category": "Architecture"
                })
                
                logger.info(f"Successfully processed article: {title.get_text(strip=True)}")
                
            except Exception as e:
                logger.error(f"Error processing Leibal article: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error scraping Leibal: {str(e)}")
        
    logger.info(f"Finished scraping Leibal. Found {len(articles)} articles")
    return articles