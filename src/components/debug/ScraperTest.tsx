import { useState } from 'react';
import { Button } from '../ui/Button';
import { testScraper } from '../../services/api';

interface ScraperResult {
  source: string;
  articlesFound: number;
  error?: string;
  sampleArticle?: {
    title: string;
    url: string;
  };
}

interface ScraperResponse {
  success: boolean;
  results: ScraperResult[];
  error?: string;
  timestamp: string;
}

export function ScraperTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ScraperResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    setError(null);

    try {
      const data = await testScraper();
      setResults(data.results);
      setLastRun(data.timestamp);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to run scraper test');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold">Scraper Test</h4>
          {lastRun && (
            <p className="text-xs text-gray-500">
              Last run: {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          onClick={runTest}
          disabled={isRunning}
          variant="outline"
          className="text-sm"
        >
          {isRunning ? 'Running Test...' : 'Test Scraper'}
        </Button>
      </div>

      {error && (
        <div className="p-2 mb-4 bg-red-50 text-red-600 rounded text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded">
              <div className="font-medium">{result.source}</div>
              {result.error ? (
                <div className="text-sm text-red-600">{result.error}</div>
              ) : (
                <>
                  <div className="text-sm text-gray-600">
                    Found {result.articlesFound} articles
                  </div>
                  {result.sampleArticle && (
                    <div className="mt-2 text-sm">
                      <div className="font-medium">Sample Article:</div>
                      <div>{result.sampleArticle.title}</div>
                      <a 
                        href={result.sampleArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Article
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}