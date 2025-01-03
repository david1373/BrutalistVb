import { PlaywrightScraper } from '../scraper/PlaywrightScraper';
import { supabaseClient } from '../lib/supabase';

async function main() {
  const scraper = new PlaywrightScraper('https://leibal.com', {
    headless: true,  // Set to false to see the browser in action
    maxRetries: 3,
    waitTime: 2000
  });

  try {
    // Initialize the browser
    await scraper.init();

    // Get list of articles from first 3 pages
    let allArticleUrls: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const urls = await scraper.scrapeArticleList(page);
      allArticleUrls = [...allArticleUrls, ...urls];
      // Wait between pages to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Found ${allArticleUrls.length} articles to scrape`);

    // Scrape each article
    for (const url of allArticleUrls) {
      try {
        const article = await scraper.scrapeArticle(url);
        
        // Take a screenshot of the main image
        await scraper.takeScreenshot('div.entry-content img', `screenshots/${article.title}.png`);

        // Save to Supabase
        const { error } = await supabaseClient
          .from('articles')
          .upsert({
            title: article.title,
            content: article.content,
            image_url: article.imageUrl,
            author: article.author,
            published_at: article.publishedAt,
            tags: article.tags,
            source: 'Leibal',
            url: url
          });

        if (error) throw error;
        
        console.log(`Successfully scraped and saved: ${article.title}`);
        
        // Be respectful with rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to process article ${url}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run the scraper
main();