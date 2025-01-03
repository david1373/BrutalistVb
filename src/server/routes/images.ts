import express from 'express';
import multer from 'multer';
import { optimizeImage, uploadImage } from '../../lib/imageUtils';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/optimize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { width, height, quality } = req.query;
    const optimized = await optimizeImage(req.file.buffer, {
      width: width ? parseInt(width as string) : undefined,
      height: height ? parseInt(height as string) : undefined,
      quality: quality ? parseInt(quality as string) : undefined
    });

    res.set('Content-Type', 'image/webp');
    res.send(optimized);
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'No path provided' });
    }

    const result = await uploadImage(req.file, path);
    res.json(result);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;