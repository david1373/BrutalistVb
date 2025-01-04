import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers import scrape_all_sources
from logger import setup_logger
from datetime import datetime

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
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        raise ConnectionError(f"Failed to initialize Supabase client: {str(e)}")

def main():
    logger = setup_logger()
    
    try:
        # Initialize Supabase
        supabase = init_supabase()
        
        # Test connection
        try:
            health_check = supabase.table('sources').select("*").limit(1).execute()
            if hasattr(health_check, 'error') and health_check.error:
                raise ConnectionError(f"Supabase connection test failed: {health_check.error}")
            logger.info("Successfully connected to Supabase")
        except Exception as e:
            raise ConnectionError(f"Supabase connection test failed: {str(e)}")
        
        # Start scraping
        results = scrape_all_sources()
        logger.info(f"Scraping completed. Found {len(results)} articles")
        
        # Process results
        for result in results:
            try:
                # Get source ID
                source_response = supabase.table("sources").select("*").eq("name", result["source"]).execute()
                
                if not source_response.data or len(source_response.data) == 0:
                    logger.error(f"Source not found: {result['source']}")
                    continue
                
                source_id = source_response.data[0]['id']
                
                # Prepare article data
                article_data = {
                    "source_id": source_id,
                    "title": result["title"],
                    "url": result["url"],
                    "image_url": result["image_url"],
                    "author": result["author"],
                    "published_at": result["published_at"],
                    "original_content": result["content"],
                    "is_processed": False,
                    "is_subscriber_only": False,
                    "category": result.get("category", "Architecture")
                }
                
                # Check if article exists
                existing_article = supabase.table("articles") \
                    .select("*") \
                    .eq("url", result["url"]) \
                    .execute()
                
                if existing_article.data and len(existing_article.data) > 0:
                    # Update existing article if content has changed
                    existing = existing_article.data[0]
                    if existing["original_content"] != result["content"]:
                        logger.info(f"Updating article with new content: {result['title']}")
                        supabase.table("articles") \
                            .update(article_data) \
                            .eq("id", existing["id"]) \
                            .execute()
                    else:
                        logger.info(f"Article exists with same content: {result['title']}")
                else:
                    # Insert new article
                    logger.info(f"Inserting new article: {result['title']}")
                    supabase.table("articles").insert(article_data).execute()
                
                # Update source last_scraped_at
                supabase.table("sources").update({
                    "last_scraped_at": datetime.utcnow().isoformat()
                }).eq("id", source_id).execute()
                
            except Exception as e:
                logger.error(f"Error processing article: {str(e)}")
                continue
    
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()