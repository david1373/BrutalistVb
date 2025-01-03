import os
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers import scrape_all_sources
from logger import setup_logger

# Load environment variables
load_dotenv()

# Set up logging
logger = setup_logger()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def main():
    try:
        logger.info("Starting scraper...")
        results = scrape_all_sources()
        logger.info(f"Scraping completed. Found {len(results)} articles")
        
        # Save results to Supabase
        for result in results:
            try:
                # Get source ID
                source = supabase.table("sources").select("id").eq("name", result["source"]).single().execute()
                if not source.data:
                    logger.error(f"Source not found: {result['source']}")
                    continue

                # Save article
                supabase.table("articles").upsert({
                    "source_id": source.data["id"],
                    "title": result["title"],
                    "url": result["url"],
                    "image_url": result["image_url"],
                    "author": result["author"],
                    "published_at": result["published_at"],
                    "original_content": result["content"],
                    "is_processed": False
                }).execute()

                # Update last scraped timestamp
                supabase.table("sources").update({
                    "last_scraped_at": "now()"
                }).eq("id", source.data["id"]).execute()

            except Exception as e:
                logger.error(f"Error saving article: {str(e)}")
                continue

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")

if __name__ == "__main__":
    main()