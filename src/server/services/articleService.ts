import { supabase } from '../../lib/supabase';
import { PlaywrightScraper } from '../../scraper/PlaywrightScraper';

interface Article {
  id?: string;
  title: string;
  content: string;
  original_content: string;
  image_url: string;
  author: string;
  published_at: string;
  meta_description?: string;
  url: string;
  source_id: string;
  scraping_status: 'pending' | 'processing' | 'completed' | 'failed';
  last_scraped_at?: Date;
  scraping_attempts: number;
  last_scraping_error?: string;
}

export class ArticleService {
  private scraper: PlaywrightScraper;

  constructor() {
    this.scraper = new PlaywrightScraper('https://leibal.com');
  }

  async init() {
    await this.scraper.init();
  }

  async cleanup() {
    await this.scraper.close();
  }

  private async updateArticle(article: Partial<Article>) {
    if (!article.id) throw new Error('Article ID is required for update');

    const { error } = await supabase
      .from('articles')
      .update({
        ...article,
        last_scraped_at: new Date().toISOString(),
        scraping_attempts: supabase.raw('scraping_attempts + 1')
      })
      .eq('id', article.id);

    if (error) throw error;
  }

  async fetchAndUpdateArticle(url: string, existingArticleId?: string) {
    try {
      // Mark article as processing
      if (existingArticleId) {
        await this.updateArticle({
          id: existingArticleId,
          scraping_status: 'processing'
        });
      }

      // Fetch new content
      const scrapedData = await this.scraper.scrapeArticle(url);

      // Prepare article data
      const articleData: Partial<Article> = {
        title: scrapedData.title,
        content: scrapedData.content,
        original_content: scrapedData.originalContent,
        image_url: scrapedData.imageUrl,
        author: scrapedData.author,
        published_at: scrapedData.publishedAt,
        meta_description: scrapedData.metaDescription,
        scraping_status: 'completed',
        url,
      };

      if (existingArticleId) {
        // Update existing article
        await this.updateArticle({
          id: existingArticleId,
          ...articleData
        });
      } else {
        // Insert new article
        const { error } = await supabase
          .from('articles')
          .insert([{
            ...articleData,
            scraping_attempts: 1,
            last_scraped_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      // Handle failure
      if (existingArticleId) {
        await this.updateArticle({
          id: existingArticleId,
          scraping_status: 'failed',
          last_scraping_error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      throw error;
    }
  }

  async processUnscrapedArticles(batchSize = 5) {
    // Get articles that need updating
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, url')
      .or('scraping_status.eq.pending,scraping_status.eq.failed')
      .order('last_scraped_at', { ascending: true, nullsFirst: true })
      .limit(batchSize);

    if (error) throw error;

    // Process each article
    const results = await Promise.allSettled(
      articles.map(article => 
        this.fetchAndUpdateArticle(article.url, article.id)
      )
    );

    return {
      total: articles.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  async rescrapeOldArticles(daysThreshold = 7, batchSize = 5) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysThreshold);

    // Get articles that haven't been updated recently
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, url')
      .lt('last_scraped_at', threshold.toISOString())
      .order('last_scraped_at', { ascending: true })
      .limit(batchSize);

    if (error) throw error;

    // Process each article
    const results = await Promise.allSettled(
      articles.map(article => 
        this.fetchAndUpdateArticle(article.url, article.id)
      )
    );

    return {
      total: articles.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  async getArticleContent(articleId: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('content, original_content, meta_description')
      .eq('id', articleId)
      .single();

    if (error) throw error;
    return data;
  }
}