import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Page, TransactionStatus } from '../../types';
import { fetchTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import { ArrowLongRightIcon, EyeIcon, InformationCircleIcon, CalendarDaysIcon, CheckBadgeIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';

const TransactionDetailsModal: React.FC<{
    details: Transaction;
    onClose: () => void;
}> = ({ details, onClose }) => {
    
    const typeStyles = {
        [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400',
        [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400',
        [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400',
    };
    const statusText = {
        [TransactionStatus.PENDING]: 'পেন্ডিং',
        [TransactionStatus.COMPLETED]: 'কমপ্লিট',
        [TransactionStatus.FAILED]: 'ব্যর্থ',
    };
    const statusStyles = {
        [TransactionStatus.COMPLETED]: 'text-green-500',
        [TransactionStatus.PENDING]: 'text-yellow-500',
        [TransactionStatus.FAILED]: 'text-red-500',
    };
    const sign = details.type === TransactionType.DEBIT ? '-' : '+';
    
    return (
        <div className="space-y-4">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${details.type === TransactionType.DEBIT ? 'from-red-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700' : 'from-green-50 to-teal-50 dark:from-slate-700/50 dark:to-slate-700'}`}>
                <p className="text-xs text-slate-500 dark:text-slate-400">পরিমাণ</p>
                <p className={`text-4xl font-bold ${typeStyles[details.type]}`}>{sign}৳{toBengaliNumber(details.amount.toFixed(2))}</p>
            </div>
            
            <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 mt-0.5 text-slate-400" />
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">বিবরণ</p>
                        <p className="font-semibold text-[15px]">{details.description}</p>
                    </div>
                </div>
                 <div className="flex items-start space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 mt-0.5 text-slate-400" />
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">তারিখ ও আইডি</p>
                        <p className="font-semibold text-[15px]">{details.date}</p>
                        <p className="font-mono text-xs text-slate-400">{details.id}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3">
                    <CheckBadgeIcon className="h-5 w-5 mt-0.5 text-slate-400" />
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">স্ট্যাটাস</p>
                        <p className={`font-semibold text-[15px] ${statusStyles[details.status]}`}>{statusText[details.status]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const RecentTransactions: React.FC<{ setActivePage: (page: Page) => void }> = ({ setActivePage }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadTransactions = async () => {
            setIsLoading(true);
            try {
                const data = await fetchTransactions();
                setTransactions(data.slice(0, 4)); // সর্বশেষ ৪টি লেনদেন দেখানো হবে
            } catch (error) {
                console.error("Failed to load recent transactions", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTransactions();
    }, []);

    const handleViewDetails = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setIsModalOpen(true);
    };

    const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
        const typeStyles = {
            [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400',
            [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400',
            [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400',
        };
        const iconColor = {
            [TransactionType.CREDIT]: 'text-green-500',
            [TransactionType.DEBIT]: 'text-red-500',
            [TransactionType.BONUS]: 'text-blue-500',
        };
        const statusStyles = {
            [TransactionStatus.COMPLETED]: 'text-green-600',
            [TransactionStatus.PENDING]: 'text-yellow-600',
            [TransactionStatus.FAILED]: 'text-red-600',
        };
        const statusText = {
            [TransactionStatus.PENDING]: 'পেন্ডিং',
            [TransactionStatus.COMPLETED]: 'কমপ্লিট',
            [TransactionStatus.FAILED]: 'ব্যর্থ',
        };
        const sign = transaction.type === TransactionType.DEBIT ? '-' : '+';
        const Icon = transaction.type === TransactionType.DEBIT ? ArrowDownCircleIcon : ArrowUpCircleIcon;

        return (
            <li className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Icon className={`h-8 w-8 flex-shrink-0 ${iconColor[transaction.type]}`} />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 truncate pr-2">{transaction.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-right">
                        <p className={`font-bold text-base ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                        {transaction.status && (
                             <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>{statusText[transaction.status]}</p>
                        )}
                    </div>
                    <button onClick={() => handleViewDetails(transaction)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="বিস্তারিত দেখুন">
                        <EyeIcon className="h-5 w-5" />
                    </button>
                </div>
            </li>
        );
    };
    
    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">সাম্প্রতিক লেনদেন</h3>
                    <button 
                        onClick={() => setActivePage(Page.TRANSACTION_HISTORY)}
                        className="flex items-center text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        সব দেখুন <ArrowLongRightIcon className="h-5 w-5 ml-1"/>
                    </button>
                </div>

                {isLoading ? (
                     <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md"></div>)}
                    </div>
                ) : transactions.length > 0 ? (
                     <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-slate-500">কোনো লেনদেন পাওয়া যায়নি।</p>
                    </div>
                )}
            </div>

            {selectedTransaction && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="লেনদেনের বিবরণ">
                   <TransactionDetailsModal 
                        details={selectedTransaction} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </Modal>
            )}
        </>
    );
};

export default RecentTransactions;