-- Add new columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS scraping_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS scraping_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scraping_error TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_articles_scraping_status ON articles(scraping_status);

-- Add function to update article
CREATE OR REPLACE FUNCTION update_article_content()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_scraped_at = NOW();
    NEW.scraping_attempts = OLD.scraping_attempts + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content updates
DROP TRIGGER IF EXISTS article_content_update ON articles;
CREATE TRIGGER article_content_update
    BEFORE UPDATE OF content, original_content
    ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_content();