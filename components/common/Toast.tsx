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

  const baseStyles = 'flex items-center p-4 rounded-xl shadow-lg text-white transition-all duration-300 transform w-full max-w-sm';
  const typeStyles = {
    success: 'bg-gradient-to-r from-teal-500 to-green-500',
    error: 'bg-gradient-to-r from-red-500 to-orange-500',
  };
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      className={`${baseStyles} ${typeStyles[type]} ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
      role="alert"
    >
      <Icon className="h-7 w-7 mr-3 flex-shrink-0" />
      <span className="flex-1 font-medium text-base">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;