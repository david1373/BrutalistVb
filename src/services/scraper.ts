import fetch from 'node-fetch';
import { supabase } from '../lib/supabase';
import type { ScraperResult } from '../types/scraper';

const DEZEEN_API = 'https://www.dezeen.com/wp-json/wp/v2/posts?per_page=10';

export async function testScraper(): Promise<ScraperResult[]> {
  try {
    const response = await fetch(DEZEEN_API);
    const articles = await response.json();

    if (!Array.isArray(articles)) {
      throw new Error('Invalid API response');
    }

    // Get the source ID for Dezeen
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('name', 'Dezeen')
      .single();

    if (!source) {
      throw new Error('Dezeen source not found in database');
    }

    // Transform and save articles
    const transformedArticles = articles.map(article => ({
      source_id: source.id,
      title: article.title.rendered,
      url: article.link,
      image_url: article.featured_media_src_url,
      author: article._embedded?.author?.[0]?.name || 'Dezeen',
      published_at: article.date,
      original_content: article.content.rendered
    }));

    // Save to database
    await supabase
      .from('articles')
      .upsert(transformedArticles, { onConflict: 'url' });

    // Update last scraped timestamp
    await supabase
      .from('sources')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', source.id);

    return [{
      source: 'Dezeen',
      articlesFound: transformedArticles.length,
      sampleArticle: transformedArticles[0] ? {
        title: transformedArticles[0].title,
        url: transformedArticles[0].url
      } : undefined
    }];

  } catch (error) {
    console.error('Scraper error:', error);
    return [{
      source: 'Dezeen',
      articlesFound: 0,
      error: error instanceof Error ? error.message : 'Failed to scrape'
    }];
  }
}