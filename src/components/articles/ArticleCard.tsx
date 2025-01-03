import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  transformedContent?: string;
}

interface ArticleCardProps {
  article: Article;
  isLoading?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full bg-zinc-900 border-2 border-zinc-800">
        <CardHeader className="p-4">
          <Skeleton className="h-8 w-3/4 bg-zinc-800" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-48 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-1/2 bg-zinc-800" />
          <Skeleton className="h-24 w-full bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-zinc-900 border-2 border-zinc-800 transition-transform hover:translate-x-1 hover:-translate-y-1 cursor-pointer">
      <CardHeader className="p-4 border-b-2 border-zinc-800">
        <h2 className="font-mono text-2xl text-white uppercase tracking-tight">
          {article.title}
        </h2>
        <div className="flex justify-between items-center mt-2 text-zinc-400 font-mono text-sm">
          <span>{article.author}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-64 w-full overflow-hidden">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 to-transparent h-24" />
        </div>
        <div className="p-4 space-y-4">
          <div className="font-mono text-sm text-zinc-300 leading-relaxed">
            {article.transformedContent || article.content}
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-sm uppercase tracking-wide">
              Read More →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;