/*
  # Add category column to articles table

  1. Changes
    - Add category column to articles table
    - Set default category to 'Architecture'
    - Update existing articles with categories
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'category'
  ) THEN
    ALTER TABLE articles ADD COLUMN category text DEFAULT 'Architecture';
  END IF;
END $$;