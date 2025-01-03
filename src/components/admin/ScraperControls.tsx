import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runScraper } from '../../services/admin/scraper';
import { Button } from '../ui/Button';
import { ScraperResults } from './ScraperResults';

export function ScraperControls() {
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  const { mutate: startScraping, isLoading, error, data } = useMutation({
    mutationFn: runScraper,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['database-stats'] });
      }
    },
    onError: (error) => {
      console.error('Scraper mutation error:', error);
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Scraper Controls</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => startScraping()}
            variant="solid"
            className="text-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Scraping...' : 'Start Scrape'}
          </Button>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {error && (
            <div className="text-red-500 p-3 bg-red-50 rounded-lg">
              {error instanceof Error ? error.message : 'Failed to run scraper'}
            </div>
          )}
          
          {data?.error && (
            <div className="text-red-500 p-3 bg-red-50 rounded-lg">
              {data.error}
            </div>
          )}

          {data?.success && data.results && (
            <>
              <div className="text-sm text-gray-500">
                Last run: {new Date(data.timestamp).toLocaleString()}
              </div>
              <ScraperResults results={data.results} />
            </>
          )}
        </div>
      )}
    </div>
  );
}