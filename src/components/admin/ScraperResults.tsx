import { ScraperResult } from '../../types/scraper';

interface ScraperResultsProps {
  results: ScraperResult[];
}

export function ScraperResults({ results }: ScraperResultsProps) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{result.source}</h4>
            <span className="text-sm">
              Found {result.articlesFound} articles
            </span>
          </div>
          
          {result.error ? (
            <div className="text-red-500 text-sm">{result.error}</div>
          ) : result.sampleArticle ? (
            <div className="text-sm">
              <div className="font-medium">Sample Article:</div>
              <div className="text-gray-600">{result.sampleArticle.title}</div>
              <a 
                href={result.sampleArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Article
              </a>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}