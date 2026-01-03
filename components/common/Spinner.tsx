
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; colorClass?: string }> = ({ size = 'md', colorClass = 'border-white' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 ${colorClass} ${sizeClasses[size]}`}></div>
  );
};

export default Spinner;