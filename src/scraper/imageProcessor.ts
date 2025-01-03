import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { SCRAPER_CONFIG } from './config';

export class ImageProcessor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async processAndUpload(screenshot: Buffer, articleId: string): Promise<string[]> {
    const processedImages: string[] = [];

    for (const format of SCRAPER_CONFIG.imageProcessing.formats) {
      const processed = await sharp(screenshot)
        .resize(SCRAPER_CONFIG.imageProcessing.maxWidth)
        .toFormat(format as keyof sharp.FormatEnum, {
          quality: SCRAPER_CONFIG.imageProcessing.quality
        })
        .toBuffer();

      const fileName = `${articleId}-${Date.now()}.${format}`;
      const { data, error } = await this.supabase.storage
        .from('article-images')
        .upload(fileName, processed);

      if (error) throw error;
      processedImages.push(data.path);
    }

    return processedImages;
  }
}