/*
  # Add original content column
  
  1. Changes
    - Add original_content column to articles table to store the raw scraped content
    - Rename content to rewritten_content for clarity
    - Add is_processed flag to track which articles have been rewritten
*/

DO $$ 
BEGIN
  -- Add original_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'original_content'
  ) THEN
    ALTER TABLE articles ADD COLUMN original_content text;
    ALTER TABLE articles ADD COLUMN is_processed boolean DEFAULT false;
    -- Rename existing content column to rewritten_content
    ALTER TABLE articles RENAME COLUMN content TO rewritten_content;
  END IF;
END $$;