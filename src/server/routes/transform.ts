import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { OpenAI } from 'openai';

const router = express.Router();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use(cors());
router.use(limiter);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generatePrompt = (content: string) => {
  return `Transform the following architecture article text into Jack Kerouac's stream-of-consciousness style, 
  while maintaining all technical accuracy and architectural terminology:

  Original text:
  ${content}

  Guidelines:
  - Use Kerouac's stream-of-consciousness style
  - Maintain all architectural terms and technical details
  - Add sensory details and immediate impressions
  - Keep the emotional intensity
  - Ensure all factual information remains accurate`;
};

router.post('/transform', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in architectural writing and Jack Kerouac's style. Transform the content while maintaining technical accuracy."
        },
        {
          role: "user",
          content: generatePrompt(content)
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const transformedContent = completion.choices[0].message.content;

    res.json({ transformedContent });
  } catch (error) {
    console.error('Error transforming content:', error);
    res.status(500).json({ error: 'Failed to transform content' });
  }
});

export default router;