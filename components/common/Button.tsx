import React, { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full flex justify-center items-center font-bold text-base py-3 px-5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:translate-y-0';

  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/50',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-500/50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

export default Button;