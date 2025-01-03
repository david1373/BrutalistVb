import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '../../../test/test-utils';
import ArticleCard from '../ArticleCard';
import { mockArticles } from '../../../test/mocks/articles';

describe('ArticleCard', () => {
  it('renders loading skeleton when isLoading is true', () => {
    renderWithClient(<ArticleCard article={mockArticles[0]} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders article content correctly', () => {
    const article = mockArticles[0];
    renderWithClient(<ArticleCard article={article} />);

    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getByText(article.author)).toBeInTheDocument();
    expect(screen.getByAltText(article.title)).toHaveAttribute('src', article.imageUrl);
    expect(screen.getByText(article.transformedContent || article.content)).toBeInTheDocument();
  });

  it('prefers transformed content over original content', () => {
    const article = mockArticles[0];
    renderWithClient(<ArticleCard article={article} />);

    expect(screen.getByText(article.transformedContent!)).toBeInTheDocument();
    expect(screen.queryByText(article.content)).not.toBeInTheDocument();
  });
});