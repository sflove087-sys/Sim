
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

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

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-2xl text-white transition-all duration-300 transform ${bgColor} ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
    >
      <Icon className="h-6 w-6 mr-3" />
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
