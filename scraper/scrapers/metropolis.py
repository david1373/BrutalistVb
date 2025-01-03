import requests
from bs4 import BeautifulSoup
from .utils import get_page, extract_date
from ..logger import get_logger

logger = get_logger(__name__)

def scrape_metropolis():
    """Scrape articles from Metropolis Magazine."""
    BASE_URL = "https://metropolismag.com/sustainability/"
    articles = []
    
    try:
        soup = get_page(BASE_URL)
        if not soup:
            return articles
            
        # Find all article elements
        for article in soup.select("article.article"):
            try:
                # Extract article data
                link = article.select_one("a")
                title = article.select_one("h2")
                image = article.select_one("img")
                author = article.select_one(".author")
                date = article.select_one(".published")
                
                if not (link and title):
                    continue
                    
                # Get full article content
                article_soup = get_page(link["href"])
                content = ""
                if article_soup:
                    content_div = article_soup.select_one(".article-body")
                    if content_div:
                        content = content_div.get_text(strip=True)
                
                articles.append({
                    "source": "Metropolis",
                    "title": title.get_text(strip=True),
                    "url": link["href"],
                    "image_url": image["src"] if image else None,
                    "author": author.get_text(strip=True) if author else None,
                    "published_at": extract_date(date["datetime"]) if date else None,
                    "content": content,
                    "category": "Architecture"
                })
                
            except Exception as e:
                logger.error(f"Error processing Metropolis article: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error scraping Metropolis: {str(e)}")
        
    return articles