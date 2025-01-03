/*
  # Add content columns for article processing

  1. New Columns
    - `original_content` (text) - Raw scraped content
    - `rewritten_content` (text) - Kerouac-style processed content
    - `is_processed` (boolean) - Processing status flag

  2. Changes
    - Add columns with safe checks
    - Set default values
*/

DO $$ 
BEGIN
  -- Add original_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'original_content'
  ) THEN
    ALTER TABLE articles ADD COLUMN original_content text;
  END IF;

  -- Add rewritten_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'rewritten_content'
  ) THEN
    ALTER TABLE articles ADD COLUMN rewritten_content text;
  END IF;

  -- Add is_processed flag if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'is_processed'
  ) THEN
    ALTER TABLE articles ADD COLUMN is_processed boolean DEFAULT false;
  END IF;
END $$;