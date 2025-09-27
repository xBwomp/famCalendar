import React from 'react';
import { Calendar, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  console.log('login function:', login);
  console.log('login function:', login);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Calendar className="w-12 h-12 text-blue-600" />
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Admin Access Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Google account to access the admin dashboard
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Administrator Login
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Access calendar management, settings, and Google Calendar integration
                </p>
              </div>

              <a href="http://localhost:3001/auth/google" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Sign in with Google
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>

              <div className="mt-6 text-center">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
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
