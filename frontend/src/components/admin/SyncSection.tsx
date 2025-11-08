import React from 'react';
import { CheckCircle, Calendar, FolderSync as Sync } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Alert } from '../ui/Alert';

interface SyncSectionProps {
  syncStatus: { success?: boolean; message?: string } | null;
  actionLoading: string | null;
  onTestConnection: () => void;
  onSyncCalendars: () => void;
  onSyncEvents: () => void;
  onFullSync: () => void;
}

export const SyncSection = ({
  syncStatus,
  actionLoading,
  onTestConnection,
  onSyncCalendars,
  onSyncEvents,
  onFullSync,
}: SyncSectionProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Calendar Sync</h2>

      {syncStatus && (
        <div className="mb-4">
          <Alert
            variant={syncStatus.success ? 'success' : 'error'}
            message={syncStatus.message || (syncStatus.success ? 'Sync completed successfully' : 'Sync failed')}
          />
        </div>
      )}

      <Card>
        <CardBody>
          <p className="text-sm text-gray-600 mb-4">
            Sync your Google Calendar data to display events on the public dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={onTestConnection}
              disabled={actionLoading === 'test-connection'}
              isLoading={actionLoading === 'test-connection'}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Test Connection
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onSyncCalendars}
              disabled={actionLoading === 'sync-calendars'}
              isLoading={actionLoading === 'sync-calendars'}
              icon={<Calendar className="w-4 h-4" />}
            >
              Sync Calendars
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onSyncEvents}
              disabled={actionLoading === 'sync-events'}
              isLoading={actionLoading === 'sync-events'}
              icon={<Sync className="w-4 h-4" />}
            >
              Sync Events
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onFullSync}
              disabled={actionLoading === 'full-sync'}
              isLoading={actionLoading === 'full-sync'}
              icon={<Sync className="w-4 h-4" />}
            >
              Full Sync
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
