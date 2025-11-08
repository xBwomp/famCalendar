import React, { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500',
  secondary: 'text-indigo-700 bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 focus:ring-indigo-500',
  danger: 'text-red-700 bg-white border border-red-300 hover:bg-red-50 focus:ring-red-500',
  ghost: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded',
  md: 'px-4 py-2 text-sm font-medium rounded-lg',
  lg: 'px-6 py-3 text-base font-medium rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      children,
      icon,
      iconPosition = 'left',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClass = variantClasses[variant];
    const sizeClass = sizeClasses[size];
    const finalClassName = `${baseClasses} ${sizeClass} ${variantClass} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={finalClassName}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {icon && iconPosition === 'left' && !isLoading && <span className="mr-2">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && !isLoading && <span className="ml-2">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
