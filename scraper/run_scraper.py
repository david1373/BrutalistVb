import logging
import argparse
import sys
from dotenv import load_dotenv
from scraper.leibal_scraper import LeibalScraper
from scraper.scrapers.dezeen import scrape_dezeen

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper.log')
    ]
)

def main():
    # Load environment variables
    load_dotenv()

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run architecture scrapers')
    parser.add_argument('--pages', type=int, default=5,
                      help='Number of pages to scrape (default: 5)')
    parser.add_argument('--source', type=str, default='all',
                      choices=['all', 'leibal', 'dezeen'],
                      help='Source to scrape (default: all)')
    parser.add_argument('--category', type=str, default='architecture',
                      help='Category to scrape (default: architecture)')
    args = parser.parse_args()

    logger = logging.getLogger(__name__)
    logger.info(f"Starting scraper for {args.pages} pages from {args.source}")

    try:
        results = []

        # Run Leibal scraper
        if args.source in ['all', 'leibal']:
            logger.info("Starting Leibal scraper...")
            with LeibalScraper('leibal') as scraper:
                leibal_results = scraper.scrape_category(
                    category=args.category,
                    max_pages=args.pages
                )
                results.extend(leibal_results)
                logger.info(f"Completed Leibal scraping. Found {len(leibal_results)} articles")

        # Run Dezeen scraper
        if args.source in ['all', 'dezeen']:
            logger.info("Starting Dezeen scraper...")
            dezeen_results = scrape_dezeen(max_pages=args.pages)
            results.extend(dezeen_results)
            logger.info(f"Completed Dezeen scraping. Found {len(dezeen_results)} articles")
            
        # Log final results
        logger.info(f"Scraping completed. Processed {len(results)} total articles")
        for result in results:
            logger.info(f"Saved article: {result.get('title', 'Unknown')} from {result.get('source', 'Unknown')}")

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()