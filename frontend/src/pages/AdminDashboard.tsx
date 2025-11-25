import React, { useState, useEffect } from 'react';
import { Settings, Calendar, ToggleLeft, ToggleRight, User, LogOut, RefreshCw, FolderSync as Sync, CheckCircle, XCircle, Clock, Home, AlertTriangle, Monitor, Save, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calendarApi, Calendar as CalendarType, seedApi, syncApi, adminApi } from '../api';
import { DisplayPreferences, CalendarView, SyncLog } from '../../../shared/types';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>({
    defaultView: 'week',
    daysToShow: 7,
    startHour: 7,
    endHour: 20,
    showWeekends: true
  });
  const [prefChanged, setPrefChanged] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Helper to check if any action is currently loading
  const isAnyActionLoading = () => {
    return actionLoading !== null || loading;
  };

  // Retry mechanism for failed operations
  const retryOperation = async (
    operationName: string,
    operation: () => Promise<void>,
    maxRetries: number = 3
  ) => {
    const currentRetry = retryCount[operationName] || 0;

    if (currentRetry >= maxRetries) {
      toast.error(`Maximum retry attempts (${maxRetries}) reached. Please try again later.`);
      setRetryCount(prev => ({ ...prev, [operationName]: 0 }));
      return;
    }

    setRetryCount(prev => ({ ...prev, [operationName]: currentRetry + 1 }));
    toast.info(`Retrying... (Attempt ${currentRetry + 1} of ${maxRetries})`);

    try {
      await operation();
      setRetryCount(prev => ({ ...prev, [operationName]: 0 }));
    } catch (err) {
      console.error(`Retry failed for ${operationName}:`, err);
    }
  };

  const fetchLastSyncTime = async () => {
    try {
      const response = await adminApi.getLastSyncTime();
      if (response.success && response.data) {
        setLastSyncTime(response.data.lastSyncTime);
      }
    } catch (err) {
      console.error('Error fetching last sync time:', err);
    }
  };

  const fetchDisplayPreferences = async () => {
    try {
      const response = await adminApi.getDisplayPreferences();
      if (response.success && response.data) {
        setDisplayPreferences(response.data);
      }
    } catch (err) {
      console.error('Error fetching display preferences:', err);
    }
  };

  const saveDisplayPreferences = async () => {
    setActionLoading('save-preferences');

    try {
      const response = await adminApi.updateDisplayPreferences(displayPreferences);
      if (response.success) {
        toast.success('Display preferences saved successfully');
        setPrefChanged(false);
      } else {
        toast.error(response.error || 'Failed to save display preferences');
      }
    } catch (err) {
      toast.error('Failed to save display preferences');
      console.error('Error saving display preferences:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const updatePreference = <K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K]
  ) => {
    setDisplayPreferences(prev => ({ ...prev, [key]: value }));
    setPrefChanged(true);
  };

  const fetchSyncLogs = async (limit: number = 10) => {
    try {
      const response = await syncApi.getLogs(limit);
      if (response.success && response.data) {
        setSyncLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching sync logs:', err);
    }
  };

  const fetchCalendars = async (showSuccessToast: boolean = false) => {
    setLoading(true);

    try {
      const response = await calendarApi.getAll();
      if (response.success && response.data) {
        setCalendars(response.data);
        if (showSuccessToast) {
          toast.success(`Loaded ${response.data.length} calendars`);
        }
      } else {
        toast.error(response.error || 'Failed to fetch calendars');
      }
    } catch (err) {
      toast.error('Failed to fetch calendars');
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
        // Update local state
        const calendar = calendars.find(cal => cal.id === calendarId);
        const calendarName = calendar?.name || 'Calendar';
        setCalendars(prev =>
          prev.map(cal =>
            cal.id === calendarId
              ? { ...cal, selected: !cal.selected }
              : cal
          )
        );
        const newStatus = calendar?.selected ? 'hidden' : 'visible';
        toast.success(`${calendarName} is now ${newStatus}`);
      } else {
        toast.error(response.error || 'Failed to toggle calendar');
      }
    } catch (err) {
      toast.error('Failed to toggle calendar');
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
        toast.success(response.message || 'Sample data created successfully');
        await fetchCalendars();
      } else {
        toast.error(response.error || 'Failed to create sample data');
      }
    } catch (err) {
      toast.error('Failed to create sample data');
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
        toast.success('All calendar data cleared successfully');
        await fetchCalendars();
      } else {
        toast.error(response.error || 'Failed to clear data');
      }
    } catch (err) {
      toast.error('Failed to clear data');
      console.error('Error clearing data:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const testGoogleConnection = async (silent: boolean = false) => {
    setActionLoading('test-connection');

    try {
      const response = await syncApi.testConnection();
      setGoogleConnected(response.success);
      if (response.data && response.data.userEmail) {
        setGoogleEmail(response.data.userEmail);
      }

      if (!silent) {
        if (response.success) {
          toast.success(response.message || 'Google Calendar connection successful');
        } else {
          toast.error(response.message || 'Google Calendar connection failed');
        }
      }
    } catch (err) {
      setGoogleConnected(false);
      if (!silent) {
        toast.error('Failed to test connection');
      }
      console.error('Error testing connection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const syncCalendars = async () => {
    setActionLoading('sync-calendars');

    try {
      const response = await syncApi.syncCalendars();
      if (response.success) {
        toast.success(response.message || 'Calendars synced successfully');
        await fetchCalendars();
        await fetchLastSyncTime();
        await fetchSyncLogs();
      } else {
        toast.error(response.message || 'Failed to sync calendars');
      }
    } catch (err) {
      toast.error('Failed to sync calendars');
      console.error('Error syncing calendars:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const syncEvents = async () => {
    setActionLoading('sync-events');

    try {
      const response = await syncApi.syncEvents();
      if (response.success) {
        toast.success(response.message || 'Events synced successfully');
        await fetchLastSyncTime();
        await fetchSyncLogs();
      } else {
        toast.error(response.message || 'Failed to sync events');
      }
    } catch (err) {
      toast.error('Failed to sync events');
      console.error('Error syncing events:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const fullSync = async () => {
    setActionLoading('full-sync');

    try {
      const response = await syncApi.fullSync();
      if (response.success) {
        toast.success(response.message || 'Full sync completed successfully');
        await fetchCalendars();
        await fetchLastSyncTime();
        await fetchSyncLogs();
      } else {
        toast.error(response.message || 'Failed to perform full sync');
      }
    } catch (err) {
      toast.error('Failed to perform full sync');
      console.error('Error during full sync:', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchLastSyncTime();
    fetchDisplayPreferences();
    fetchSyncLogs();
    testGoogleConnection(true); // Silent check on load
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              {lastSyncTime && (
                <div className="text-sm text-gray-500 ml-4">
                  <p>Last updated: {new Date(lastSyncTime).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation links */}
              <div className="hidden sm:flex items-center space-x-2 mr-4">
                <a
                  href="/"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </a>
              </div>
              
              {user && (
                <div className="flex items-center space-x-3">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Google Calendar Sync */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Calendar Sync</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Authentication Status */}
            {googleConnected !== null && (
              <div className={`mb-4 p-3 rounded-md border ${
                googleConnected
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {googleConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        googleConnected ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {googleConnected ? 'Google Calendar Connected' : 'Google Calendar Not Connected'}
                      </p>
                      {googleEmail && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Connected as: {googleEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  {!googleConnected && (
                    <a
                      href="/auth/google"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Connect Now
                    </a>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-4">
              Sync your Google Calendar data to display events on the public dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={testGoogleConnection}
                disabled={actionLoading === 'test-connection'}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'test-connection' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </button>
              
              <button
                onClick={syncCalendars}
                disabled={actionLoading === 'sync-calendars'}
                className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'sync-calendars' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Sync Calendars
              </button>
              
              <button
                onClick={syncEvents}
                disabled={actionLoading === 'sync-events'}
                className="inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'sync-events' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sync className="w-4 h-4 mr-2" />
                )}
                Sync Events
              </button>
              
              <button
                onClick={fullSync}
                disabled={actionLoading === 'full-sync'}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'full-sync' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sync className="w-4 h-4 mr-2" />
                )}
                Full Sync
              </button>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Display Preferences
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-6">
              Configure how the public dashboard displays calendar events
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default View */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default View
                </label>
                <select
                  value={displayPreferences.defaultView}
                  onChange={(e) => updatePreference('defaultView', e.target.value as CalendarView)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Day View</option>
                  <option value="week">Week View</option>
                  <option value="month">Month View</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Initial calendar view shown to users
                </p>
              </div>

              {/* Days to Show */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days to Show
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={displayPreferences.daysToShow}
                  onChange={(e) => updatePreference('daysToShow', parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of days to display (1-30)
                </p>
              </div>

              {/* Start Hour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Hour
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={displayPreferences.startHour}
                  onChange={(e) => updatePreference('startHour', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Day view start time (0-23)
                </p>
              </div>

              {/* End Hour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Hour
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={displayPreferences.endHour}
                  onChange={(e) => updatePreference('endHour', parseInt(e.target.value) || 23)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Day view end time (0-23)
                </p>
              </div>

              {/* Show Weekends */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displayPreferences.showWeekends}
                    onChange={(e) => updatePreference('showWeekends', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show Weekends
                  </span>
                </label>
                <p className="mt-1 ml-7 text-xs text-gray-500">
                  Include Saturday and Sunday in calendar views
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end">
              {prefChanged && (
                <span className="text-sm text-yellow-600 mr-4">Unsaved changes</span>
              )}
              <button
                onClick={saveDisplayPreferences}
                disabled={!prefChanged || actionLoading === 'save-preferences'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'save-preferences' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Sync History */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Sync History
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {syncLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No sync history available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {syncLogs.slice(0, showAllLogs ? syncLogs.length : 5).map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {log.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : log.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              log.status === 'completed'
                                ? 'text-green-700'
                                : log.status === 'failed'
                                ? 'text-red-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{log.message}</p>
                        {log.events_synced > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {log.events_synced} events synced
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          {new Date(log.started_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.started_at).toLocaleTimeString()}
                        </p>
                        {log.completed_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Duration:{' '}
                            {Math.round(
                              (new Date(log.completed_at).getTime() -
                                new Date(log.started_at).getTime()) /
                                1000
                            )}
                            s
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {syncLogs.length > 5 && (
              <div className="border-t border-gray-200">
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1"
                >
                  {showAllLogs ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show All ({syncLogs.length} total)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Development Tools</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={createSampleData}
              disabled={actionLoading === 'sample-data'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'sample-data' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Create Sample Data
            </button>
            
            <button
              onClick={clearData}
              disabled={actionLoading === 'clear-data'}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'clear-data' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Clear All Data
            </button>
            
            <button
              onClick={() => fetchCalendars(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Calendar Management */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Management</h2>
          
          {calendars.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calendars found</h3>
              <p className="text-gray-500 mb-4">Create some sample data to get started.</p>
              <button
                onClick={createSampleData}
                disabled={actionLoading === 'sample-data'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'sample-data' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Create Sample Data
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Calendars ({calendars.length})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Toggle calendars on/off to control what appears on the public dashboard
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {[...calendars].sort((a, b) => b.selected - a.selected).map((calendar) => (
                  <div key={calendar.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{calendar.name}</h4>
                        {calendar.description && (
                          <p className="text-sm text-gray-500">{calendar.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleCalendar(calendar.id)}
                      disabled={actionLoading === calendar.id}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === calendar.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                      ) : calendar.selected ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-600" />
                          <span className="text-green-600">Visible</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-500">Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;