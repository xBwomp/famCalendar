import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuickActionsProps {
  actionLoading: string | null;
  onCreateSampleData: () => void;
  onClearData: () => void;
  onRefresh: () => void;
}

export const QuickActions = ({
  actionLoading,
  onCreateSampleData,
  onClearData,
  onRefresh,
}: QuickActionsProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Development Tools</h2>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={onCreateSampleData}
          disabled={actionLoading === 'sample-data'}
          isLoading={actionLoading === 'sample-data'}
          icon={<Calendar className="w-4 h-4" />}
        >
          Create Sample Data
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={onClearData}
          disabled={actionLoading === 'clear-data'}
          isLoading={actionLoading === 'clear-data'}
          icon={<Calendar className="w-4 h-4" />}
        >
          Clear All Data
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={onRefresh}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
