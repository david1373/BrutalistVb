import { Article } from '../../types/article';
import { formatDate } from '../../utils/date';

interface ArticleHeaderProps {
  article: Article;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <div className="flex items-center gap-4 text-gray-600">
        <span>{article.author}</span>
        <span>•</span>
        <time>{formatDate(article.date)}</time>
      </div>
    </header>
  );
}