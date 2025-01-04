from scraper.scrapers.dezeen import scrape_dezeen

def scrape_all_sources():
    """Run all scrapers and combine results."""
    results = []
    
    # Add results from each scraper
    results.extend(scrape_dezeen())
    
    return results