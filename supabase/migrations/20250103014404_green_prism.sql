/*
  # Create articles and sources tables

  1. New Tables
    - `sources` - Tracks news sources to scrape
      - `id` (uuid, primary key) 
      - `name` (text) - Source name
      - `url` (text) - Base URL
      - `enabled` (boolean) - Whether source is active
      - `last_scraped_at` (timestamp) - Last successful scrape
    
    - `articles` - Stores scraped articles
      - `id` (uuid, primary key)
      - `source_id` (uuid, foreign key)
      - `title` (text)
      - `content` (text)
      - `url` (text)
      - `image_url` (text)
      - `author` (text)
      - `published_at` (timestamp)
      - `created_at` (timestamp)
      - `is_subscriber_only` (boolean)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  enabled boolean DEFAULT true,
  last_scraped_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sources"
  ON sources FOR SELECT
  TO authenticated
  USING (true);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  title text NOT NULL,
  content text,
  url text UNIQUE NOT NULL,
  image_url text,
  author text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  is_subscriber_only boolean DEFAULT false
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);