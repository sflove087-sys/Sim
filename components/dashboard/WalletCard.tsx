
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useWallet } from '../../context/WalletContext';
import { toBengaliNumber } from '../../utils/formatters';

const WalletCard: React.FC = () => {
  const { wallet, isLoading, refreshWallet } = useWallet();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const toggleVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-3">
                 <h2 className="text-lg font-semibold text-indigo-200">আপনার ওয়ালেট ব্যালেন্স</h2>
                 <button onClick={refreshWallet} disabled={isLoading} className="focus:outline-none disabled:opacity-50">
                     <ArrowPathIcon className={`h-5 w-5 text-indigo-200 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                 </button>
            </div>
            <button onClick={toggleVisibility} className="focus:outline-none">
                {isBalanceVisible ? <EyeSlashIcon className="h-6 w-6 text-indigo-200" /> : <EyeIcon className="h-6 w-6 text-indigo-200" />}
            </button>
        </div>
        {isLoading && !wallet ? (
            <div className="h-10 bg-white/20 animate-pulse rounded-md w-3/4"></div>
        ) : (
            <p className="text-4xl font-bold">
            {isBalanceVisible && wallet ? `৳ ${toBengaliNumber(wallet.balance.toFixed(2))}` : '••••••'}
            </p>
        )}
      </div>
    </div>
  );
};

export default WalletCard;
