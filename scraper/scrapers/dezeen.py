import requests
from bs4 import BeautifulSoup
from scraper.scrapers.utils import extract_date
from scraper.logger import get_logger
import time

logger = get_logger(__name__)

def get_page_with_retry(url, max_retries=3, delay=1):
    """Get page content with retry mechanism"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if response.status_code == 200:
                return BeautifulSoup(response.text, 'html.parser')
            elif response.status_code == 429:  # Too many requests
                time.sleep(delay * (attempt + 1))  # Exponential backoff
            else:
                logger.warning(f"Failed to get page: {url}, status: {response.status_code}")
        except Exception as e:
            logger.error(f"Error getting page {url}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(delay)
    return None

def get_article_content(article_soup):
    """Enhanced content extraction with more robust selectors"""
    content_selectors = [
        ".entry__content", ".article__content", ".post__content",
        ".content-area", "#main-content", ".main-content",
        "article .content", "[itemprop='articleBody']"
    ]
    
    for selector in content_selectors:
        content_div = article_soup.select_one(selector)
        if content_div:
            # Get all text elements
            text_elements = content_div.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            content = '\n\n'.join([el.get_text(strip=True) for el in text_elements if el.get_text(strip=True)])
            
            # Get image captions
            captions = content_div.find_all(['figcaption', '.caption', '.wp-caption-text'])
            if captions:
                caption_text = '\n\n'.join([cap.get_text(strip=True) for cap in captions if cap.get_text(strip=True)])
                content = f"{content}\n\nImage Captions:\n{caption_text}"
                
            return content
    return ""

def get_pagination_urls(base_url, soup):
    """Extract pagination URLs"""
    pagination = soup.select_one(".pagination") or soup.select_one(".nav-links")
    if pagination:
        page_links = pagination.find_all("a", href=True)
        return [link["href"] for link in page_links if "page" in link["href"]]
    return []

def scrape_dezeen(max_pages=5):
    """Scrape articles from Dezeen with improved content extraction and pagination."""
    BASE_URL = "https://www.dezeen.com/architecture/"
    articles = []
    
    try:
        logger.info(f"Starting to scrape {BASE_URL}")
        current_page = 1
        
        while current_page <= max_pages:
            page_url = BASE_URL if current_page == 1 else f"{BASE_URL}page/{current_page}/"
            soup = get_page_with_retry(page_url)
            
            if not soup:
                logger.error(f"Failed to get page {current_page}")
                break
            
            # Find all article elements (trying different selectors)
            article_elements = soup.select(".dezeen-article") or \
                             soup.select(".article") or \
                             soup.select("article") or \
                             soup.select(".post")
            
            logger.info(f"Found {len(article_elements)} potential articles on page {current_page}")
            
            # Process each article
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
                    
                    article_title = title.get_text(strip=True)
                    logger.info(f"Processing article: {article_title}")
                    
                    # Get full article content
                    article_url = link.get("href")
                    if not article_url.startswith("http"):
                        article_url = f"https://www.dezeen.com{article_url}"
                        
                    article_soup = get_page_with_retry(article_url)
                    content = get_article_content(article_soup) if article_soup else ""
                    
                    # Add a delay to avoid hitting rate limits
                    time.sleep(1)
                    
                    articles.append({
                        "source": "Dezeen",
                        "title": article_title,
                        "url": article_url,
                        "image_url": image["src"] if image and "src" in image.attrs else None,
                        "author": author.get_text(strip=True) if author else None,
                        "published_at": extract_date(date["datetime"]) if date and date.get("datetime") else None,
                        "content": content,
                        "category": "Architecture"
                    })
                    
                    logger.info(f"Successfully processed article: {article_title}")
                    
                except Exception as e:
                    logger.error(f"Error processing Dezeen article: {str(e)}")
                    continue
            
            current_page += 1
            time.sleep(2)  # Rate limiting between pages
                
    except Exception as e:
        logger.error(f"Error scraping Dezeen: {str(e)}")
        
    logger.info(f"Finished scraping Dezeen. Found {len(articles)} articles")
    return articles
