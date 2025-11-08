import React from 'react';
import { Calendar, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Calendar className="w-12 h-12 text-indigo-600" />
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Family Calendar
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Google account to access the admin dashboard
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-indigo-100 hover:shadow-xl transition-shadow">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Administrator Login
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Access calendar management, settings, and Google Calendar integration
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={login}
                className="w-full"
                icon={
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
                iconPosition="left"
              >
                Sign in with Google
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <div className="mt-6 text-center">
                <a
                  href="/"
                  className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                >
                  ← Back to Public Calendar
                </a>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Only authorized administrators can access the admin panel.
              <br />
              The public calendar is available to everyone on the local network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;