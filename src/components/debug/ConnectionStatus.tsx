import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkConnection = async () => {
    try {
      setStatus('checking');
      const { data, error } = await supabase
        .from('sources')
        .select('count');

      if (error) throw error;
      
      setStatus('success');
      setErrorMessage('');
      console.log('Connection successful, found sources table');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      console.error('Supabase connection error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
      <h3 className="font-bold mb-2">Supabase Connection Status</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              status === 'checking' ? 'bg-yellow-500' :
              status === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`}
          />
          <span>{status === 'checking' ? 'Checking...' : status}</span>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
        <button
          onClick={checkConnection}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}