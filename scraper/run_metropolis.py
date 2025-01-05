import logging
import argparse
import sys
from dotenv import load_dotenv
from scraper.metropolis_scraper import MetropolisScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('metropolis_scraper.log')
    ]
)

def main():
    # Load environment variables
    load_dotenv()

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the Metropolis Magazine scraper')
    parser.add_argument('--pages', type=int, default=5,
                        help='Number of pages to scrape (default: 5)')
    args = parser.parse_args()

    logger = logging.getLogger(__name__)
    logger.info(f"Starting Metropolis scraper for {args.pages} pages")

    try:
        # Initialize and run scraper
        with MetropolisScraper('metropolis') as scraper:
            results = scraper.scrape_category(max_pages=args.pages)
            
            # Log results
            logger.info(f"Scraping completed. Processed {len(results)} articles")
            for result in results:
                logger.info(f"Saved article: {result.get('title', 'Unknown')}")

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()