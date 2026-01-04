import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;