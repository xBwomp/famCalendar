import React, { ReactNode } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  icon?: boolean;
  onClose?: () => void;
}

const variantClasses: Record<AlertVariant, { container: string; text: string; icon: React.ReactNode }> = {
  success: {
    container: 'bg-green-50 border border-green-200 text-green-800',
    text: 'text-green-800',
    icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
  },
  error: {
    container: 'bg-red-50 border border-red-200 text-red-800',
    text: 'text-red-800',
    icon: <XCircle className="w-5 h-5 flex-shrink-0" />,
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    text: 'text-yellow-800',
    icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 text-blue-800',
    text: 'text-blue-800',
    icon: <Info className="w-5 h-5 flex-shrink-0" />,
  },
};

export const Alert = ({
  variant = 'info',
  title,
  message,
  icon = true,
  onClose,
}: AlertProps) => {
  const variantClass = variantClasses[variant];

  return (
    <div className={`rounded-lg p-4 shadow-sm ${variantClass.container}`}>
      <div className="flex items-start">
        {icon && <div className="mr-3 flex-shrink-0">{variantClass.icon}</div>}
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <p className={`text-sm ${title ? variantClass.text : 'font-medium'}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 inline-flex text-${variant === 'success' ? 'green' : variant === 'error' ? 'red' : variant === 'warning' ? 'yellow' : 'blue'}-400 hover:text-${variant === 'success' ? 'green' : variant === 'error' ? 'red' : variant === 'warning' ? 'yellow' : 'blue'}-500`}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
