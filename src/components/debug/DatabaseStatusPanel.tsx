import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { DatabaseStats } from './DatabaseStats';
import { ScraperTest } from './ScraperTest';
import { fetchDatabaseStats } from '../../services/database';

export function DatabaseStatusPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await fetchDatabaseStats();
      setStats(stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-[80vh] overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Database Status</h3>
        <Button 
          onClick={checkDatabase}
          disabled={isLoading}
          variant="outline"
          className="text-sm"
        >
          {isLoading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {stats && <DatabaseStats {...stats} />}
      
      <ScraperTest />
    </div>
  );
}