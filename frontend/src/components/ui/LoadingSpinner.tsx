import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};
