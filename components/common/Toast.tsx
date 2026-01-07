import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // allow for fade-out transition
    }, 4700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: {
      border: 'border-teal-500',
      iconColor: 'text-teal-500',
      title: 'সফল!'
    },
    error: {
      border: 'border-red-500',
      iconColor: 'text-red-500',
      title: 'ত্রুটি!'
    },
  };
  
  const styles = typeStyles[type];
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      className={`flex items-start p-4 rounded-xl shadow-lg w-full max-w-sm transition-all duration-300 transform bg-white dark:bg-slate-800 border-l-4 ${styles.border} ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
      role="alert"
    >
      <Icon className={`h-6 w-6 mr-3 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
      <div className="flex-1">
          <p className="font-bold text-base text-slate-800 dark:text-slate-200">{styles.title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none flex-shrink-0">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;