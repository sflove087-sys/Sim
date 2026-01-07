import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-4',
  };
  return (
    <div
        className={`animate-spin rounded-full border-solid ${sizeClasses[size]} border-current border-t-transparent ${className}`}
        role="status"
    >
        <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;