from .dezeen import scrape_dezeen
from .leibal import scrape_leibal
from .metropolis import scrape_metropolis

def scrape_all_sources():
    """Run all scrapers and return combined results."""
    results = []
    
    # Run each scraper
    results.extend(scrape_dezeen())
    results.extend(scrape_leibal())
    results.extend(scrape_metropolis())
    
    return results