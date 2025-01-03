import axios from 'axios';
import { rateLimit } from '../utils/rateLimiter';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface TransformOptions {
  maxTokens?: number;
  temperature?: number;
}

export class TextTransformService {
  private apiKey: string;
  private rateLimiter: typeof rateLimit;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50 // Adjust based on your API tier
    });
  }

  private generateKerouacPrompt(text: string): string {
    return `Transform the following architecture article text into Jack Kerouac's stream-of-consciousness style, 
    while maintaining all technical accuracy and architectural terminology. 
    Keep the meaning and information intact but make it flow like Kerouac's prose:

    Original text:
    ${text}

    Guidelines:
    - Use long, flowing sentences with minimal punctuation
    - Maintain all architectural terms and technical details
    - Add sensory details and immediate impressions
    - Keep the emotional intensity of Kerouac's style
    - Ensure all factual information remains accurate`;
  }

  async transformText(text: string, options: TransformOptions = {}): Promise<string> {
    await this.rateLimiter();

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert in architectural writing and Jack Kerouac's style. 
              Your task is to transform architectural content while maintaining technical accuracy.`
            },
            {
              role: 'user',
              content: this.generateKerouacPrompt(text)
            }
          ],
          max_tokens: options.maxTokens || 1500,
          temperature: options.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error transforming text:', error);
      throw new Error('Failed to transform text');
    }
  }

  async processBatch(articles: Array<{ id: string; content: string }>): Promise<Array<{ id: string; transformedContent: string }>> {
    const results = [];
    
    for (const article of articles) {
      try {
        const transformedContent = await this.transformText(article.content);
        results.push({
          id: article.id,
          transformedContent
        });
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        // Continue with next article instead of failing entire batch
        continue;
      }
    }

    return results;
  }
}