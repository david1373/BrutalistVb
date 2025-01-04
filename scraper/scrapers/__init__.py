from scraper.scrapers.dezeen import scrape_dezeen
from scraper.scrapers.leibal import scrape_leibal

def scrape_all_sources():
    """Run all scrapers and combine results."""
    results = []
    
    # Add results from each scraper
    results.extend(scrape_dezeen())
    results.extend(scrape_leibal())
    
    return results