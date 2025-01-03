import { ImageProcessor } from '../src/scraper/imageProcessor';
import sharp from 'sharp';
import { supabase } from '../src/lib/supabase';

describe('ImageProcessor Integration Tests', () => {
  let imageProcessor: ImageProcessor;
  let testImageUrls: string[] = [];

  beforeAll(() => {
    imageProcessor = new ImageProcessor();
  });

  afterAll(async () => {
    // Clean up test images
    await imageProcessor.cleanup(testImageUrls);
  });

  it('should process and upload images', async () => {
    // Create a test image
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    const urls = await imageProcessor.processAndUpload(testImage, 'test-article');
    testImageUrls = urls;

    expect(urls).toBeInstanceOf(Array);
    expect(urls.length).toBeGreaterThan(0);

    // Verify images are accessible
    for (const url of urls) {
      const response = await fetch(url);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toMatch(/^image\//); 
    }
  });

  it('should handle image processing errors gracefully', async () => {
    const invalidImage = Buffer.from('invalid image data');

    await expect(imageProcessor.processAndUpload(invalidImage, 'test-error'))
      .rejects
      .toThrow();
  });
});