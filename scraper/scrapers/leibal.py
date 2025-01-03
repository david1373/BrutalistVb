import requests
from bs4 import BeautifulSoup
from .utils import get_page, extract_date
from ..logger import get_logger

logger = get_logger(__name__)

def scrape_leibal():
    """Scrape articles from Leibal."""
    BASE_URL = "https://leibal.com/category/architecture/"
    articles = []
    
    try:
        soup = get_page(BASE_URL)
        if not soup:
            return articles
            
        # Find all article elements
        for article in soup.select("article.post"):
            try:
                # Extract article data
                link = article.select_one("a")
                title = article.select_one(".entry-title")
                image = article.select_one("img")
                date = article.select_one(".entry-date")
                
                if not (link and title):
                    continue
                    
                # Get full article content
                article_soup = get_page(link["href"])
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".entry-content")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                articles.append({
                    "source": "Leibal",
                    "title": title.get_text(strip=True),
                    "url": link["href"],
                    "image_url": image["src"] if image else None,
                    "author": "Leibal",  # Leibal articles typically don't have individual authors
                    "published_at": extract_date(date["datetime"]) if date else None,
                    "content": content,
                    "category": "Architecture"
                })
                
            except Exception as e:
                logger.error(f"Error processing Leibal article: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error scraping Leibal: {str(e)}")
        
    return articles