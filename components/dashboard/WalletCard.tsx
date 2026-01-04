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
    <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-2xl shadow-lg overflow-hidden flex items-center justify-between">
        <div className="absolute -left-8 -top-8 w-32 h-32 bg-white/10 rounded-full opacity-50"></div>
        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full opacity-50"></div>
      
        <div className="relative z-10">
            <h2 className="text-sm font-medium text-indigo-200">ওয়ালেট ব্যালেন্স</h2>
            {isLoading && !wallet ? (
                <div className="h-9 w-36 bg-white/20 animate-pulse rounded-md mt-1"></div>
            ) : (
                <div className="flex items-center space-x-3 mt-1">
                    <p className="text-3xl font-bold tracking-wider">
                        { wallet ?
                            (isBalanceVisible ? `৳ ${toBengaliNumber(wallet.balance.toFixed(2))}` : '•••••')
                            : <span className="text-lg text-amber-200">ব্যালেন্স পাওয়া যায়নি</span>
                        }
                    </p>
                    <button onClick={toggleVisibility} className="p-1 rounded-full hover:bg-white/20 focus:outline-none transition-colors" title={isBalanceVisible ? "ব্যালেন্স লুকান" : "ব্যালেন্স দেখুন"}>
                        {isBalanceVisible ? <EyeSlashIcon className="h-6 w-6 text-indigo-200" /> : <EyeIcon className="h-6 w-6 text-indigo-200" />}
                    </button>
                </div>
            )}
        </div>
        
        <div className="relative z-10">
            <button onClick={refreshWallet} disabled={isLoading} className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none disabled:opacity-50 transition-all hover:scale-110 active:scale-95" title="রিফ্রেশ করুন">
                <ArrowPathIcon className={`h-6 w-6 text-white transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    </div>
  );
};

export default WalletCard;