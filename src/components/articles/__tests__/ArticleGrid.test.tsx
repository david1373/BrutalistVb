import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '../../../test/test-utils';
import { ArticleGrid } from '../ArticleGrid';
import { mockArticles } from '../../../test/mocks/articles';

describe('ArticleGrid', () => {
  it('renders loading skeletons when isLoading is true', () => {
    renderWithClient(<ArticleGrid articles={[]} isLoading={true} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders all articles', () => {
    renderWithClient(<ArticleGrid articles={mockArticles} />);

    mockArticles.forEach(article => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
    });
  });

  it('renders no articles when array is empty', () => {
    renderWithClient(<ArticleGrid articles={[]} />);
    expect(screen.queryByTestId('article-card')).not.toBeInTheDocument();
  });
});