import { chromium } from 'playwright';

async function testImageScraping() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.dezeen.com');
    
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        }));
    });

    console.log('Found images:', images.length);
    console.log('Sample images:', images.slice(0, 3));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testImageScraping();