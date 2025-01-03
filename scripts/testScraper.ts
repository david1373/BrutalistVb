import { chromium } from 'playwright';
import { dezeenScraper } from '../src/scrapers/dezeen';
import { logError } from '../src/scrapers/utils/logger';

async function testScraper() {
  console.log('🔍 Starting scraper test...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    console.log('✓ Browser launched');
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();
    console.log('✓ Page created');

    // Test Dezeen scraper
    console.log('\n📑 Testing Dezeen scraper...');
    
    // Log the URL we're accessing
    console.log('Accessing:', Object.values(dezeenScraper.urls)[0]);
    
    const articles = await dezeenScraper.scrape(page);
    
    if (articles.length === 0) {
      console.log('❌ No articles found');
      
      // Get page content for debugging
      const content = await page.content();
      console.log('\nPage HTML preview (first 500 chars):');
      console.log(content.substring(0, 500));
      
    } else {
      console.log(`✓ Found ${articles.length} articles`);
      console.log('\nFirst article details:');
      console.log(JSON.stringify(articles[0], null, 2));
    }

  } catch (error) {
    logError('Scraper test failed', error);
    
    if (error instanceof Error) {
      console.log('\nError details:');
      console.log('Name:', error.name);
      console.log('Message:', error.message);
      console.log('Stack:', error.stack);
    }
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
}

testScraper();