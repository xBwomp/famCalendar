import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calendarApi, Calendar as CalendarType, seedApi, syncApi, adminApi } from '../api';
import { LoadingSpinner, Alert } from '../components/ui';
import { AdminHeader, SyncSection, QuickActions, CalendarList } from '../components/admin';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const fetchLastSyncTime = async () => {
    try {
      const response = await adminApi.getLastSyncTime();
      if (response.success && response.data) {
        setLastSyncTime(response.data.lastSyncTime);
      } else {
        console.error(response.error || 'Failed to fetch last sync time');
      }
    } catch (err) {
      console.error('Error fetching last sync time:', err);
    }
  };

  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await calendarApi.getAll();
      if (response.success && response.data) {
        setCalendars(response.data);
      } else {
        setError(response.error || 'Failed to fetch calendars');
      }
    } catch (err) {
      setError('Failed to fetch calendars');
      console.error('Error fetching calendars:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = async (calendarId: string) => {
    setActionLoading(calendarId);

    try {
      const response = await calendarApi.toggle(calendarId);
      if (response.success) {
        setCalendars((prev) =>
          prev.map((cal) => (cal.id === calendarId ? { ...cal, selected: !cal.selected } : cal))
        );
      } else {
        setError(response.error || 'Failed to toggle calendar');
      }
    } catch (err) {
      setError('Failed to toggle calendar');
      console.error('Error toggling calendar:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const createSampleData = async () => {
    setActionLoading('sample-data');

    try {
      const response = await seedApi.createSampleData();
      if (response.success) {
        await fetchCalendars();
      } else {
        setError(response.error || 'Failed to create sample data');
      }
    } catch (err) {
      setError('Failed to create sample data');
      console.error('Error creating sample data:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all calendar data? This cannot be undone.')) {
      return;
    }

    setActionLoading('clear-data');

    try {
      const response = await seedApi.clearData();
      if (response.success) {
        await fetchCalendars();
      } else {
        setError(response.error || 'Failed to clear data');
      }
    } catch (err) {
      setError('Failed to clear data');
      console.error('Error clearing data:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const testGoogleConnection = async () => {
    setActionLoading('test-connection');
    setSyncStatus(null);

    try {
      const response = await syncApi.testConnection();
      setSyncStatus({
        success: response.success,
        message: response.message || (response.success ? 'Connection successful' : 'Connection failed'),
      });
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to test connection',
      });
      console.error('Error testing connection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const syncCalendars = async () => {
    setActionLoading('sync-calendars');
    setSyncStatus(null);

    try {
      const response = await syncApi.syncCalendars();
      setSyncStatus({
        success: response.success,
        message: response.message || 'Calendars synced successfully',
      });
      if (response.success) {
        await fetchCalendars();
      }
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to sync calendars',
      });
      console.error('Error syncing calendars:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const syncEvents = async () => {
    setActionLoading('sync-events');
    setSyncStatus(null);

    try {
      const response = await syncApi.syncEvents();
      setSyncStatus({
        success: response.success,
        message: response.message || 'Events synced successfully',
      });
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to sync events',
      });
      console.error('Error syncing events:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const fullSync = async () => {
    setActionLoading('full-sync');
    setSyncStatus(null);

    try {
      const response = await syncApi.fullSync();
      setSyncStatus({
        success: response.success,
        message: response.message || 'Full sync completed successfully',
      });
      if (response.success) {
        await fetchCalendars();
      }
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to perform full sync',
      });
      console.error('Error during full sync:', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchLastSyncTime();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader lastSyncTime={lastSyncTime} onLogout={logout} user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

        <SyncSection
          syncStatus={syncStatus}
          actionLoading={actionLoading}
          onTestConnection={testGoogleConnection}
          onSyncCalendars={syncCalendars}
          onSyncEvents={syncEvents}
          onFullSync={fullSync}
        />

        <QuickActions
          actionLoading={actionLoading}
          onCreateSampleData={createSampleData}
          onClearData={clearData}
          onRefresh={fetchCalendars}
        />

        <CalendarList
          calendars={calendars}
          actionLoading={actionLoading}
          onToggleCalendar={toggleCalendar}
          onCreateSampleData={createSampleData}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
