/*
  # Enable public access to articles and sources

  1. Security Changes
    - Allow public (anonymous) access to read articles and sources
    - Keep existing authenticated user policies
*/

-- Update articles table policies
CREATE POLICY "Allow public read access to articles"
  ON articles FOR SELECT
  TO anon
  USING (true);

-- Update sources table policies
CREATE POLICY "Allow public read access to sources"
  ON sources FOR SELECT
  TO anon
  USING (true);