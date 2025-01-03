import sharp from 'sharp';
import { supabaseClient } from './supabase';

export async function optimizeImage(buffer: Buffer, options: {
  width?: number;
  height?: number;
  quality?: number;
}) {
  const { width, height, quality = 80 } = options;

  try {
    let imageProcess = sharp(buffer);

    if (width || height) {
      imageProcess = imageProcess.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    }

    return await imageProcess
      .webp({ quality })
      .toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

export async function generatePlaceholder(buffer: Buffer) {
  try {
    const placeholderBuffer = await sharp(buffer)
      .resize(10, 10, { fit: 'cover' })
      .blur()
      .toBuffer();
    return `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error generating placeholder:', error);
    throw error;
  }
}

export async function uploadImage(file: File, path: string) {
  try {
    const buffer = await file.arrayBuffer();
    const optimized = await optimizeImage(Buffer.from(buffer), {
      width: 1200,
      quality: 80
    });
    
    const placeholder = await generatePlaceholder(Buffer.from(buffer));
    
    const { error } = await supabaseClient
      .storage
      .from('images')
      .upload(path, optimized, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) throw error;

    return {
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${path}`,
      placeholder
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}