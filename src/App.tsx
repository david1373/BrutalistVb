import { Routes, Route } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { ArticleGrid } from './components/articles/ArticleGrid';
import { HomeHeader } from './components/articles/HomeHeader';
import { TrendingTopics } from './components/TrendingTopics';
import { useArticles } from './hooks/useArticles';

const trendingTopics = [
  'Brutalism',
  'Concrete Architecture', 
  'Urban Megastructures',
  'Brutalist Interiors',
  'Adaptive Reuse of Brutalist Buildings'
];

export default function App() {
  const { data: articles, isLoading, error } = useArticles();

  return (
    <PageLayout>
      <HomeHeader 
        category="Architecture"
        date="January 2"
      />
      <div className="flex gap-12">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading articles...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error loading articles: {error.message}</div>
        ) : (
          <ArticleGrid articles={articles || []} />
        )}
        <TrendingTopics topics={trendingTopics} />
      </div>
    </PageLayout>
  );
}