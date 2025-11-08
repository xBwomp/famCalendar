import React from 'react';
import { Settings, Home, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminHeaderProps {
  lastSyncTime?: string | null;
  onLogout: () => void;
  user?: {
    name: string;
    email: string;
    picture?: string;
  } | null;
}

export const AdminHeader = ({ lastSyncTime, onLogout, user }: AdminHeaderProps) => {
  return (
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

            <Button
              variant="ghost"
              size="md"
              onClick={onLogout}
              icon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
