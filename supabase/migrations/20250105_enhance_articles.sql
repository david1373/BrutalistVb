-- Add new columns for enhanced article tracking
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS scraping_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS scraping_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scraping_error TEXT,
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_articles_scraping_status 
    ON public.articles(scraping_status);

CREATE INDEX IF NOT EXISTS idx_articles_last_scraped_at 
    ON public.articles(last_scraped_at);

-- Create enum for scraping status
DO $$ BEGIN
    CREATE TYPE scraping_status_enum AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing statuses
UPDATE public.articles 
SET scraping_status = CASE 
    WHEN is_processed THEN 'completed'::scraping_status_enum 
    ELSE 'pending'::scraping_status_enum 
END;

-- Add function for handling article updates
CREATE OR REPLACE FUNCTION handle_article_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update scraping metadata
    NEW.last_scraped_at = NOW();
    NEW.scraping_attempts = COALESCE(OLD.scraping_attempts, 0) + 1;
    
    -- Update content status
    IF NEW.original_content IS NOT NULL AND NEW.original_content != OLD.original_content THEN
        NEW.is_processed = FALSE;
        NEW.transformed_content = NULL;
    END IF;
    
    -- Set status based on condition
    IF NEW.scraping_status = 'completed' AND NEW.original_content IS NULL THEN
        NEW.scraping_status = 'failed';
        NEW.last_scraping_error = 'No content found';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS article_update_trigger ON public.articles;
CREATE TRIGGER article_update_trigger
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION handle_article_update();

-- Add function for validating articles before insert
CREATE OR REPLACE FUNCTION validate_article()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure URL is not empty
    IF NEW.url IS NULL OR NEW.url = '' THEN
        RAISE EXCEPTION 'URL cannot be empty';
    END IF;
    
    -- Initialize scraping metadata
    NEW.scraping_attempts = 0;
    NEW.scraping_status = 'pending';
    NEW.last_scraped_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new articles
DROP TRIGGER IF EXISTS article_insert_trigger ON public.articles;
CREATE TRIGGER article_insert_trigger
    BEFORE INSERT ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION validate_article();

-- Add comments for documentation
COMMENT ON COLUMN public.articles.meta_description IS 'SEO meta description from the article';
COMMENT ON COLUMN public.articles.scraping_status IS 'Current status of the scraping process';
COMMENT ON COLUMN public.articles.scraping_attempts IS 'Number of times we attempted to scrape this article';
COMMENT ON COLUMN public.articles.last_scraping_error IS 'Last error encountered during scraping';
COMMENT ON COLUMN public.articles.last_scraped_at IS 'Timestamp of the last scraping attempt';