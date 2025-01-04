import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers import scrape_all_sources
from logger import setup_logger

def init_supabase() -> Client:
    # Load environment variables
    load_dotenv()
    
    # Use VITE_ prefixed variables if they exist, fall back to non-VITE versions
    supabase_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise EnvironmentError(
            "Missing Supabase environment variables. "
            "Please ensure either VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY "
            "or SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file"
        )
    
    try:
        # Create client with additional options
        client = create_client(
            supabase_url,
            supabase_key,
            options={
                'schema': 'public',
                'headers': {
                    'X-Client-Info': 'supabase-py/0.0.1',
                },
                'realtime': {
                    'params': {
                        'eventsPerSecond': 10
                    }
                }
            }
        )
        return client
    except Exception as e:
        raise ConnectionError(f"Failed to initialize Supabase client: {str(e)}")

def main():
    logger = setup_logger()
    
    try:
        # Initialize Supabase
        supabase = init_supabase()
        
        # Test connection
        health_check = supabase.table('sources').select("count(*)", count='exact').execute()
        if health_check.error:
            raise ConnectionError(f"Supabase connection test failed: {health_check.error}")
            
        logger.info("Successfully connected to Supabase")
        
        # Start scraping
        results = scrape_all_sources()
        logger.info(f"Scraping completed. Found {len(results)} articles")
        
        # Process results
        for result in results:
            try:
                # Get source ID
                source = supabase.table("sources") \
                    .select("id") \
                    .eq("name", result["source"]) \
                    .execute()
                
                if not source.data or len(source.data) == 0:
                    logger.error(f"Source not found: {result['source']}")
                    continue
                
                source_id = source.data[0]['id']
                
                # Save article
                article = {
                    "source_id": source_id,
                    "title": result["title"],
                    "url": result["url"],
                    "image_url": result["image_url"],
                    "author": result["author"],
                    "published_at": result["published_at"],
                    "original_content": result["content"],
                    "is_processed": False
                }
                
                # Check if article already exists
                existing = supabase.table("articles") \
                    .select("id") \
                    .eq("url", result["url"]) \
                    .execute()
                
                if existing.data and len(existing.data) > 0:
                    # Update existing article
                    article_response = supabase.table("articles") \
                        .update(article) \
                        .eq("id", existing.data[0]['id']) \
                        .execute()
                else:
                    # Insert new article
                    article_response = supabase.table("articles") \
                        .insert(article) \
                        .execute()
                
                if article_response.error:
                    raise Exception(f"Failed to save article: {article_response.error.message}")
                
                # Update last scraped timestamp
                supabase.table("sources") \
                    .update({"last_scraped_at": "now()"}) \
                    .eq("id", source_id) \
                    .execute()
                
                logger.info(f"Successfully processed article: {result['title']}")
                
            except Exception as e:
                logger.error(f"Error processing article: {str(e)}")
                continue
    
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()