/*
  # Add initial data

  1. New Data
    - Add sample sources
    - Add sample articles
  
  2. Changes
    - Insert initial data for testing
*/

-- Insert sample sources
INSERT INTO sources (name, url, enabled)
VALUES 
  ('Dezeen', 'https://www.dezeen.com', true),
  ('Leibal', 'https://leibal.com', true),
  ('Metropolis', 'https://metropolismag.com', true);

-- Insert sample articles
INSERT INTO articles (
  source_id,
  title,
  url,
  image_url,
  author,
  published_at,
  is_subscriber_only
)
SELECT
  s.id,
  'Brutalist concrete house emerges from Brazilian mountainside',
  'https://example.com/article1',
  'https://images.unsplash.com/photo-1520100021567-f4b8a182bc41?auto=format&fit=crop&q=80',
  'John Architect',
  NOW() - INTERVAL '1 day',
  false
FROM sources s
WHERE s.name = 'Dezeen'

UNION ALL

SELECT
  s.id,
  'Minimalist concrete pavilion celebrates raw materials',
  'https://example.com/article2',
  'https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?auto=format&fit=crop&q=80',
  'Maria Designer',
  NOW() - INTERVAL '2 days',
  true
FROM sources s
WHERE s.name = 'Leibal';