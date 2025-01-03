-- Create articles table
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create index on status for filtering
CREATE INDEX idx_articles_status ON articles(status);

-- Create index on created_at for sorting
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- Add RLS policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy for reading published articles (public)
CREATE POLICY "Published articles are viewable by everyone" 
    ON articles FOR SELECT 
    USING (status = 'published');

-- Policy for managing articles (authenticated users)
CREATE POLICY "Authenticated users can manage articles" 
    ON articles FOR ALL 
    USING (auth.role() = 'authenticated');

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
