import { useParams, Navigate } from 'react-router-dom';
import { useArticle } from '../hooks/useArticle';
import { PageLayout } from '../components/layout/PageLayout';
import { ArticleContent } from '../components/articles/ArticleContent';
import { ArticleHeader } from '../components/articles/ArticleHeader';
import { LoadingArticle } from '../components/loading/LoadingArticle';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function ArticleDetail() {
  const { id } = useParams();
  const { data: article, isLoading, error } = useArticle(id);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <PageLayout>
        <LoadingArticle />
      </PageLayout>
    );
  }

  if (error || !article) {
    return (
      <PageLayout>
        <ErrorMessage 
          title="Article not found"
          message="The article you're looking for doesn't exist or has been removed."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <article className="max-w-4xl mx-auto">
        <ArticleHeader article={article} />
        <ArticleContent article={article} />
      </article>
    </PageLayout>
  );
}