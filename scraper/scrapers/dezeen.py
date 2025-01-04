import requests
from bs4 import BeautifulSoup
from scraper.scrapers.utils import get_page, extract_date
from scraper.logger import get_logger

logger = get_logger(__name__)

def scrape_dezeen():
    """Scrape articles from Dezeen."""
    BASE_URL = "https://www.dezeen.com/architecture/"
    articles = []
    
    try:
        logger.info(f"Starting to scrape {BASE_URL}")
        soup = get_page(BASE_URL)
        if not soup:
            logger.error("Failed to get page content")
            return articles
        
        # Find all article elements (trying different selectors)
        article_elements = soup.select(".dezeen-article") or \
                         soup.select(".article") or \
                         soup.select("article") or \
                         soup.select(".post")
        
        logger.info(f"Found {len(article_elements)} potential articles")
        
        # Find all article elements
        for article in article_elements:
            try:
                # Extract article data
                link = article.select_one("a") or article.find("a")
                title = article.select_one("h3") or article.find("h2") or article.find("h1")
                image = article.select_one("img")
                author = article.select_one(".author-name") or article.select_one(".author")
                date = article.select_one("time") or article.select_one(".date")
                
                if not (link and title):
                    logger.warning(f"Skipping article - missing link or title")
                    continue
                
                logger.info(f"Processing article: {title.get_text(strip=True)}")
                
                # Get full article content
                article_url = link.get("href")
                if not article_url.startswith("http"):
                    article_url = f"https://www.dezeen.com{article_url}"
                    
                article_soup = get_page(article_url)
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".article-content") or \
                                 article_soup.select_one(".content") or \
                                 article_soup.select_one(".post-content")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                articles.append({
                    "source": "Dezeen",
                    "title": title.get_text(strip=True),
                    "url": article_url,
                    "image_url": image["src"] if image else None,
                    "author": author.get_text(strip=True) if author else None,
                    "published_at": extract_date(date["datetime"]) if date and date.get("datetime") else None,
                    "content": content,
                    "category": "Architecture"
                })
                
                logger.info(f"Successfully processed article: {title.get_text(strip=True)}")
                
            except Exception as e:
                logger.error(f"Error processing Dezeen article: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error scraping Dezeen: {str(e)}")
        
    logger.info(f"Finished scraping Dezeen. Found {len(articles)} articles")
    return articles