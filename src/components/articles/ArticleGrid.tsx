import { ArticlePreview } from '../../types/article';
import { NewsCard } from '../NewsCard';

interface ArticleGridProps {
  articles: ArticlePreview[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  if (!articles?.length) {
    return <div className="text-center py-8 text-gray-500">No articles found</div>;
  }

  // Separate featured and regular articles
  const featuredArticles = articles.slice(0, 2);
  const regularArticles = articles.slice(2);

  return (
    <div className="space-y-8 flex-1">
      {/* Featured articles - 2 large cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featuredArticles.map(article => (
          <NewsCard
            key={article.id}
            {...article}
            featured
          />
        ))}
      </div>

      {/* Regular articles - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {regularArticles.map(article => (
          <NewsCard
            key={article.id}
            {...article}
          />
        ))}
      </div>
    </div>
  );
}