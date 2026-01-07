import React from 'react';
import Spinner from './Spinner';

const LoadingModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center space-y-4 w-full max-w-xs transform animate-modal-enter"
      >
        <Spinner size="lg" />
        <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              প্রসেসিং হচ্ছে...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              অনুগ্রহ করে অপেক্ষা করুন।
            </p>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes modal-enter {
            0% { transform: scale(0.9) translateY(10px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
        .animate-modal-enter {
            animation: modal-enter 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingModal;