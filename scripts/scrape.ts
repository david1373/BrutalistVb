import { setupBrowser, createBrowserContext, createPage } from '../src/scrapers/utils/browser';
import { getEnabledSources, saveArticle, updateSourceLastScraped } from '../src/scrapers/utils/database';
import { scrapers } from '../src/scrapers';
import { logScrapingStart, logScrapingResults, logError } from '../src/scrapers/utils/logger';

async function scrapeArticles() {
  console.log('\n🚀 Starting article scrape:', new Date().toISOString());
  
  const browser = await setupBrowser();
  
  try {
    const context = await createBrowserContext(browser);
    const page = await createPage(context);

    const sources = await getEnabledSources();

    if (!sources?.length) {
      console.log('❌ No sources found');
      return;
    }

    console.log(`📋 Found ${sources.length} sources to scrape\n`);

    for (const source of sources) {
      try {
        const scraper = scrapers[source.name as keyof typeof scrapers];
        if (!scraper) {
          console.log(`⚠️ No scraper found for ${source.name}, skipping...`);
          continue;
        }

        logScrapingStart(source.name);
        const articles = await scraper.scrape(page);
        
        if (articles.length === 0) {
          console.log(`⚠️ No articles found for ${source.name}`);
          continue;
        }

        console.log(`📊 Found ${articles.length} articles from ${source.name}`);
        
        let savedCount = 0;
        for (const article of articles) {
          if (await saveArticle(source.id, article)) {
            savedCount++;
          }
        }

        await updateSourceLastScraped(source.id);
        logScrapingResults(source.name, savedCount);
      } catch (error) {
        logError(`Error scraping ${source.name}`, error);
      }
    }

  } catch (error) {
    logError('Fatal scraping error', error);
  } finally {
    await browser.close();
  }
}

scrapeArticles();