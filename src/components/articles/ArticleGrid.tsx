import React from 'react';
import ArticleCard from './ArticleCard';

interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  transformedContent?: string;
}

interface ArticleGridProps {
  articles: Article[];
  isLoading?: boolean;
}

export const ArticleGrid: React.FC<ArticleGridProps> = ({ articles, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <ArticleCard key={i} article={{} as Article} isLoading />
        ))
      ) : (
        articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))
      )}
    </div>
  );
};

export default ArticleGrid;