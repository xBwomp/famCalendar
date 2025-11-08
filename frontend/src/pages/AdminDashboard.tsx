import React, { useState, useEffect } from 'react';
import { Settings, Calendar, ToggleLeft, ToggleRight, User, LogOut, RefreshCw, FolderSync as Sync, CheckCircle, XCircle, Clock, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calendarApi, Calendar as CalendarType, seedApi, syncApi } from '../api';

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
        // Update local state
        setCalendars(prev => 
          prev.map(cal => 
            cal.id === calendarId 
              ? { ...cal, selected: !cal.selected }
              : cal
          )
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
        await fetchCalendars(); // Refresh the list
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
        await fetchCalendars(); // Refresh the list
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
        message: response.message || (response.success ? 'Connection successful' : 'Connection failed')
      });
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to test connection'
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
        message: response.message || 'Calendars synced successfully'
      });
      if (response.success) {
        await fetchCalendars(); // Refresh the calendar list
      }
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to sync calendars'
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
        message: response.message || 'Events synced successfully'
      });
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to sync events'
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
        message: response.message || 'Full sync completed successfully'
      });
      if (response.success) {
        await fetchCalendars(); // Refresh the calendar list
      }
    } catch (err) {
      setSyncStatus({
        success: false,
        message: 'Failed to perform full sync'
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-indigo-600" />
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
                  className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors font-medium"
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && (
          <div className={`mb-6 p-4 rounded-lg border shadow-sm font-medium ${
            syncStatus.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {syncStatus.success ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              <p>{syncStatus.message}</p>
            </div>
          </div>
        )}

        {/* Google Calendar Sync */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Calendar Sync</h2>
          <div className="bg-white rounded-lg border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 mb-4">
              Sync your Google Calendar data to display events on the public dashboard.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={testGoogleConnection}
                disabled={actionLoading === 'test-connection'}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
                className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
                className="inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Development Tools</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={createSampleData}
              disabled={actionLoading === 'sample-data'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {actionLoading === 'clear-data' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Clear All Data
            </button>

            <button
              onClick={fetchCalendars}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Calendar Management */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Management</h2>

          {calendars.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-indigo-100 shadow-sm">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calendars found</h3>
              <p className="text-gray-500 mb-4">Create some sample data to get started.</p>
              <button
                onClick={createSampleData}
                disabled={actionLoading === 'sample-data'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
            <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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