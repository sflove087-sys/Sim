import React, { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 scale-95 animate-modal-enter border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes modal-enter {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
        .animate-modal-enter {
            animation: modal-enter 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;