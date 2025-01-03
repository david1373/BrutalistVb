import { Article } from '../../types/article';

interface ArticleContentProps {
  article: Article;
}

export function ArticleContent({ article }: ArticleContentProps) {
  return (
    <>
      <img
        src={article.image}
        alt={article.title}
        className="w-full aspect-video object-cover rounded-lg mb-8"
      />
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </>
  );
}