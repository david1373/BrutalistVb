import { formatDate } from '../../utils/date';

interface Source {
  name: string;
  enabled: boolean;
  last_scraped_at: string | null;
}

interface Article {
  title: string;
  source: string | null;
  published_at: string | null;
  has_content: boolean;
}

interface DatabaseStatsProps {
  sources: Source[];
  articles: Article[];
}

export function DatabaseStats({ sources, articles }: DatabaseStatsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Sources ({sources.length})</h4>
        <div className="space-y-2">
          {sources.map(source => (
            <div key={source.name} className="p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{source.name}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Last scraped: {source.last_scraped_at ? formatDate(new Date(source.last_scraped_at)) : 'never'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Recent Articles ({articles.length})</h4>
        <div className="space-y-2">
          {articles.slice(0, 5).map((article, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded">
              <div className="font-medium">{article.title}</div>
              <div className="text-sm text-gray-600">
                Source: {article.source || 'unknown'}
              </div>
              <div className="text-sm text-gray-600">
                Published: {article.published_at ? formatDate(new Date(article.published_at)) : 'unknown'}
              </div>
              <div className="text-sm">
                Content: {article.has_content ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}