import { PageLayout } from '../components/layout/PageLayout';
import { DatabaseStatusPanel } from '../components/admin/DatabaseStatusPanel';
import { ScraperControls } from '../components/admin/ScraperControls';

export function AdminPage() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DatabaseStatusPanel />
          <ScraperControls />
        </div>
      </div>
    </PageLayout>
  );
}