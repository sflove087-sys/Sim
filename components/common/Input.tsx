import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;