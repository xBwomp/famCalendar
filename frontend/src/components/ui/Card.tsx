import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card = ({ children, className = '', hoverable = false }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-lg border border-indigo-100 p-6 shadow-sm ${
        hoverable ? 'hover:shadow-md transition-shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  description?: string;
}

export const CardHeader = ({ title, description }: CardHeaderProps) => {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={`${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>{children}</div>;
};
