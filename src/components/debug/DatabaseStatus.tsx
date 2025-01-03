import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function DatabaseStatus() {
  const [status, setStatus] = useState<{
    sources: number;
    articles: number;
    error?: string;
  }>({ sources: 0, articles: 0 });

  const checkTables = async () => {
    try {
      // Check sources
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('*');
      
      if (sourcesError) throw sourcesError;

      // Check articles
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*');
      
      if (articlesError) throw articlesError;

      setStatus({
        sources: sources?.length || 0,
        articles: articles?.length || 0
      });
    } catch (error) {
      setStatus(s => ({
        ...s,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
      <h3 className="font-bold mb-2">Database Status</h3>
      <div className="space-y-2 text-sm">
        <p>Sources: {status.sources}</p>
        <p>Articles: {status.articles}</p>
        {status.error && (
          <p className="text-red-500">{status.error}</p>
        )}
        <button
          onClick={checkTables}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Check Tables
        </button>
      </div>
    </div>
  );
}