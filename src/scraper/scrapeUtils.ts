import { Page } from 'playwright';

export interface ContentBlock {
  type: 'text' | 'image' | 'header' | 'quote' | 'list';
  content: string;
  metadata?: {
    alt?: string;
    caption?: string;
    level?: number;
    source?: string;
  };
}

export interface ExtractedContent {
  title: string;
  metaDescription: string;
  originalContent: string;
  processedContent: string;
  structuredContent: ContentBlock[];
  mainImage: {
    url: string;
    alt: string;
    caption?: string;
  };
  author: string;
  publishedAt: string;
  tags: string[];
}

const selectors = {
  article: 'article.entry-content, div.entry-content',
  title: 'h1.entry-title',
  author: 'a[rel="author"]',
  date: 'time',
  tags: 'a[rel="tag"]',
  images: 'img',
  paragraphs: 'p',
  headers: 'h2, h3, h4, h5, h6',
  lists: 'ul, ol',
  quotes: 'blockquote',
  metaDescription: 'meta[name="description"]',
};

export async function extractStructuredContent(page: Page): Promise<ExtractedContent> {
  // First, get the original HTML content
  const originalContent = await page.$eval(selectors.article, el => el.innerHTML);

  // Extract meta information
  const [title, metaDescription, author, publishedAt] = await Promise.all([
    page.$eval(selectors.title, el => el.textContent?.trim() || ''),
    page.$eval(selectors.metaDescription, el => el.getAttribute('content') || ''),
    page.$eval(selectors.author, el => el.textContent?.trim() || 'Unknown'),
    page.$eval(selectors.date, el => el.getAttribute('datetime') || '')
  ]);

  // Extract tags
  const tags = await page.$$eval(selectors.tags, els => 
    els.map(el => el.textContent?.trim() || '').filter(Boolean)
  );

  // Extract main image
  const mainImage = await page.$eval(`${selectors.article} ${selectors.images}`, img => ({
    url: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    caption: img.getAttribute('title') || undefined
  }));

  // Extract structured content blocks
  const structuredContent: ContentBlock[] = [];
  
  // Helper function to safely evaluate elements
  const safeEval = async (selector: string, process: (el: Element) => any): Promise<void> => {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        const result = await element.evaluate(process);
        if (result) structuredContent.push(result);
      }
    } catch (error) {
      console.error(`Error processing ${selector}:`, error);
    }
  };

  // Process text content
  await safeEval(`${selectors.article} ${selectors.paragraphs}`, (el) => ({
    type: 'text',
    content: el.textContent?.trim() || ''
  }));

  // Process headers
  await safeEval(`${selectors.article} ${selectors.headers}`, (el) => ({
    type: 'header',
    content: el.textContent?.trim() || '',
    metadata: {
      level: parseInt(el.tagName.substring(1))
    }
  }));

  // Process images
  await safeEval(`${selectors.article} ${selectors.images}`, (el) => ({
    type: 'image',
    content: el.getAttribute('src') || '',
    metadata: {
      alt: el.getAttribute('alt') || '',
      caption: el.getAttribute('title') || el.nextElementSibling?.classList.contains('wp-caption-text') 
        ? el.nextElementSibling?.textContent?.trim() 
        : undefined
    }
  }));

  // Process quotes
  await safeEval(`${selectors.article} ${selectors.quotes}`, (el) => ({
    type: 'quote',
    content: el.textContent?.trim() || '',
    metadata: {
      source: el.getAttribute('cite') || undefined
    }
  }));

  // Process lists
  await safeEval(`${selectors.article} ${selectors.lists}`, (el) => ({
    type: 'list',
    content: Array.from(el.children)
      .map(li => li.textContent?.trim())
      .filter(Boolean)
      .join('\n')
  }));

  // Create processed content from structured content
  const processedContent = structuredContent
    .map(block => {
      switch (block.type) {
        case 'header':
          return `\n# ${block.content}\n`;
        case 'text':
          return block.content;
        case 'quote':
          return `\n> ${block.content}\n`;
        case 'list':
          return `\n${block.content}\n`;
        case 'image':
          return block.metadata?.caption 
            ? `[Image: ${block.metadata.alt || 'No description'}] (${block.metadata.caption})`
            : `[Image: ${block.metadata?.alt || 'No description'}]`;
        default:
          return '';
      }
    })
    .join('\n\n')
    .trim();

  return {
    title,
    metaDescription,
    originalContent,
    processedContent,
    structuredContent,
    mainImage,
    author,
    publishedAt,
    tags
  };
}