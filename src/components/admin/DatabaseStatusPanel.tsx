import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDatabaseStats } from '../../services/admin/database';
import { Button } from '../ui/Button';
import { DatabaseStats } from './DatabaseStats';

export function DatabaseStatusPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['database-stats'],
    queryFn: getDatabaseStats,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Database Status</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="text-sm"
          >
            Refresh
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
          {isLoading ? (
            <div className="text-gray-500">Loading database stats...</div>
          ) : error ? (
            <div className="text-red-500">Error loading database stats</div>
          ) : data ? (
            <DatabaseStats stats={data} />
          ) : null}
        </div>
      )}
    </div>
  );
}