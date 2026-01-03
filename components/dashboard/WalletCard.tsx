
import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useWallet } from '../../context/WalletContext';
import { toBengaliNumber } from '../../utils/formatters';

const WalletCard: React.FC = () => {
  const { wallet, isLoading, refreshWallet } = useWallet();
  const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
    try {
      const savedVisibility = localStorage.getItem('isBalanceVisible');
      // Default to true if nothing is saved
      return savedVisibility !== null ? JSON.parse(savedVisibility) : true;
    } catch (error) {
        console.warn('Could not read balance visibility from localStorage', error);
        return true;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('isBalanceVisible', JSON.stringify(isBalanceVisible));
    } catch (error) {
        console.warn('Could not save balance visibility to localStorage', error);
    }
  }, [isBalanceVisible]);

  const toggleVisibility = () => {
    setIsBalanceVisible(prev => !prev);
  };

  return (
    <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg overflow-hidden flex items-center justify-between">
        <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full opacity-50"></div>
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full opacity-50"></div>
      
        <div className="relative z-10">
            <h2 className="text-sm font-medium text-indigo-200">ওয়ালেট ব্যালেন্স</h2>
            {isLoading && !wallet ? (
                <div className="h-8 w-32 bg-white/20 animate-pulse rounded-md mt-1"></div>
            ) : (
                <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">
                        {isBalanceVisible && wallet ? `৳ ${toBengaliNumber(wallet.balance.toFixed(2))}` : '•••••'}
                    </p>
                    <button onClick={toggleVisibility} className="p-1 rounded-full hover:bg-white/20 focus:outline-none transition-colors" title={isBalanceVisible ? "ব্যালেন্স লুকান" : "ব্যালেন্স দেখুন"}>
                        {isBalanceVisible ? <EyeSlashIcon className="h-5 w-5 text-indigo-200" /> : <EyeIcon className="h-5 w-5 text-indigo-200" />}
                    </button>
                </div>
            )}
        </div>
        
        <div className="relative z-10">
            <button onClick={refreshWallet} disabled={isLoading} className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none disabled:opacity-50 transition-colors" title="রিফ্রেশ করুন">
                <ArrowPathIcon className={`h-5 w-5 text-white transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    </div>
  );
};

export default WalletCard;
