import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

interface WelcomePopupProps {
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Animate in

    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Wait for fade out animation before removing from DOM
    }, 4500); // Start fade out before 5s

    return () => {
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out w-[90vw] max-w-sm ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}
      role="alert"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-700">
        <CheckCircleIcon className="h-10 w-10 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">স্বাগতম, {user.name}!</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">আপনি সফলভাবে লগইন করেছেন।</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
