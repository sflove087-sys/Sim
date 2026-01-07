import React, { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

interface WelcomePopupProps {
  onClose: () => void;
}

const DURATION = 5000; // 5 seconds

const WelcomePopup: React.FC<WelcomePopupProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Animate in

    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Wait for fade out animation before removing from DOM
    }, DURATION);

    return () => {
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out w-[90vw] max-w-sm ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 -translate-y-4'
      }`}
      role="alert"
    >
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">স্বাগতম, {user.name}!</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">আপনার ড্যাশবোর্ডে আপনাকে স্বাগতম।</p>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200 dark:bg-slate-700">
             <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 animate-progress"></div>
        </div>
      </div>
      <style>{`
        @keyframes progress-bar {
            from { width: 100%; }
            to { width: 0%; }
        }
        .animate-progress {
            animation: progress-bar ${DURATION / 1000}s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default WelcomePopup;