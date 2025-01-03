import sharp from 'sharp';
import { supabase } from '../lib/supabase';
import { SCRAPER_CONFIG } from './config';

export class ImageProcessor {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'article-images';
  }

  async processAndUpload(screenshot: Buffer, articleId: string): Promise<string[]> {
    try {
      const processedImages: string[] = [];

      for (const format of SCRAPER_CONFIG.imageProcessing.formats) {
        const processed = await sharp(screenshot)
          .resize(SCRAPER_CONFIG.imageProcessing.maxWidth)
          .toFormat(format as keyof sharp.FormatEnum, {
            quality: SCRAPER_CONFIG.imageProcessing.quality
          })
          .toBuffer();

        const fileName = `${articleId}-${Date.now()}.${format}`;
        
        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, processed, {
            contentType: `image/${format}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`Error uploading image ${fileName}:`, error);
          throw error;
        }

        const { data: publicUrl } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path);

        processedImages.push(publicUrl.publicUrl);
      }

      return processedImages;
    } catch (error) {
      console.error('Error in processAndUpload:', error);
      throw error;
    }
  }

  async cleanup(imageUrls: string[]) {
    try {
      for (const url of imageUrls) {
        const path = url.split('/').pop();
        if (path) {
          const { error } = await supabase.storage
            .from(this.bucketName)
            .remove([path]);
          
          if (error) {
            console.error(`Error deleting image ${path}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}