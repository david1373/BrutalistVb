/*
  # Add content management columns to articles table

  1. Changes
    - Add original_content column for storing raw scraped content
    - Add rewritten_content column for storing AI-processed content
    - Add is_processed flag to track processing status

  2. Notes
    - Uses ALTER TABLE with column additions
    - Sets default value for is_processed
*/

-- Add original content column
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS original_content text;

-- Add rewritten content column
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS rewritten_content text;

-- Add processing status flag
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;