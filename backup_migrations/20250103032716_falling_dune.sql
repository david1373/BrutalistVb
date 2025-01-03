/*
  # Add more sample data

  1. New Data
    - Add more sample articles for testing
*/

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
  'Concrete and Glass: A Study in Modern Brutalism',
  'https://example.com/article3',
  'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?auto=format&fit=crop&q=80',
  'Sarah Johnson',
  NOW() - INTERVAL '3 days',
  false
FROM sources s
WHERE s.name = 'Dezeen'

UNION ALL

SELECT
  s.id,
  'Urban Renewal: The Return of Brutalist Architecture',
  'https://example.com/article4',
  'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&q=80',
  'Michael Chen',
  NOW() - INTERVAL '4 days',
  true
FROM sources s
WHERE s.name = 'Metropolis';