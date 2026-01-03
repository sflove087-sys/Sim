
import React from 'react';
import Spinner from './Spinner';

const LoadingModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl">
        <Spinner size="lg" colorClass="border-indigo-500" />
        <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">
          প্রসেসিং হচ্ছে...
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          অনুগ্রহ করে অপেক্ষা করুন।
        </p>
      </div>
    </div>
  );
};

export default LoadingModal;