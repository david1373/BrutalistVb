# BrutalistVb

Brutalist architecture and design news app with AI-powered content transformation.

## Current Status
We've transitioned to a Python-based scraper for improved reliability and maintainability.

## Recent Updates
- Enhanced Python scraper implementation
- Improved content extraction
- Better error handling and retry logic

## Getting Started

### Frontend (React/TypeScript)
```bash
npm install
npm run dev
```

### Scraper (Python)
```bash
pip install -r requirements.txt
python scraper/run_scraper.py --pages 5
```

## Environment Setup
Create a `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Architecture
- Frontend: React/TypeScript for UI
- Scraper: Python/Playwright for content extraction
- Database: Supabase for storage and state management