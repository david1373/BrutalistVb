import { formatDate } from '../../utils/date';

interface DatabaseStatsProps {
  stats: {
    sources: Array<{
      name: string;
      enabled: boolean;
      last_scraped_at: string | null;
    }>;
    articles: Array<{
      title: string;
      source: string | null;
      published_at: string | null;
      has_content: boolean;
    }>;
  };
}

export function DatabaseStats({ stats }: DatabaseStatsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Sources ({stats.sources.length})</h3>
        <div className="grid gap-3">
          {stats.sources.map(source => (
            <div key={source.name} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">{source.name}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Last scraped: {source.last_scraped_at ? formatDate(new Date(source.last_scraped_at)) : 'Never'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Recent Articles ({stats.articles.length})</h3>
        <div className="grid gap-3">
          {stats.articles.slice(0, 5).map((article, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium">{article.title}</div>
              <div className="text-sm text-gray-600">
                Source: {article.source || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600">
                Published: {article.published_at ? formatDate(new Date(article.published_at)) : 'Unknown'}
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