import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers import scrape_all_sources
from logger import setup_logger

def init_supabase() -> Client:
    # Load environment variables
    load_dotenv()
    
    # Validate environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise EnvironmentError(
            "Missing Supabase environment variables. "
            "Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY "
            "are set in your .env file"
        )
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        raise ConnectionError(f"Failed to initialize Supabase client: {str(e)}")

def main():
    logger = setup_logger()
    
    try:
        # Initialize Supabase
        supabase = init_supabase()
        logger.info("Successfully connected to Supabase")
        
        # Start scraping
        results = scrape_all_sources()
        logger.info(f"Scraping completed. Found {len(results)} articles")
        
        # Process results
        for result in results:
            try:
                # Get source ID with better error handling
                source_response = supabase.table("sources").select("id").eq("name", result["source"]).single().execute()
                
                if source_response.error:
                    raise Exception(f"Supabase query error: {source_response.error.message}")
                
                if not source_response.data:
                    logger.error(f"Source not found: {result['source']}")
                    continue
                
                # Save article with explicit error handling
                article_response = supabase.table("articles").upsert({
                    "source_id": source_response.data["id"],
                    "title": result["title"],
                    "url": result["url"],
                    "image_url": result["image_url"],
                    "author": result["author"],
                    "published_at": result["published_at"],
                    "original_content": result["content"],
                    "is_processed": False
                }).execute()
                
                if article_response.error:
                    raise Exception(f"Failed to save article: {article_response.error.message}")
                
                # Update last scraped timestamp
                update_response = supabase.table("sources").update({
                    "last_scraped_at": "now()"
                }).eq("id", source_response.data["id"]).execute()
                
                if update_response.error:
                    raise Exception(f"Failed to update source: {update_response.error.message}")
                
                logger.info(f"Successfully processed article: {result['title']}")
                
            except Exception as e:
                logger.error(f"Error processing article: {str(e)}")
                continue
    
    except EnvironmentError as e:
        logger.critical(f"Environment configuration error: {str(e)}")
        sys.exit(1)
    except ConnectionError as e:
        logger.critical(f"Supabase connection error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()