import requests
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.logger import get_logger

logger = get_logger(__name__)

def get_page(url):
    """Fetch and parse a webpage."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except Exception as e:
        logger.error(f"Error fetching {url}: {str(e)}")
        return None

def extract_date(date_str):
    """Convert various date formats to ISO format."""
    try:
        # Try parsing common date formats
        for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%B %d, %Y"]:
            try:
                return datetime.strptime(date_str, fmt).isoformat()
            except ValueError:
                continue
        return None
    except Exception:
        return None