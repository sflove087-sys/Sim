import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { fetchTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, DocumentMagnifyingGlassIcon, InformationCircleIcon, CalendarDaysIcon, CheckBadgeIcon, EyeIcon } from '@heroicons/react/24/solid';

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


const TransactionRow: React.FC<{ transaction: Transaction; onViewDetails: (tx: Transaction) => void }> = ({ transaction, onViewDetails }) => {
    const typeStyles = {
        [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400',
        [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400',
        [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400',
    };
    const iconColor = {
        [TransactionType.CREDIT]: 'text-green-500',
        [TransactionType.DEBIT]: 'text-red-500',
        [TransactionType.BONUS]: 'text-blue-500',
    }
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
        <li className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center space-x-3">
                 <Icon className={`h-8 w-8 flex-shrink-0 ${iconColor[transaction.type]}`} />
                 <div className="flex-1">
                    <p className="font-semibold text-[15px] text-slate-800 dark:text-slate-200">{transaction.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-right">
                    <p className={`font-bold text-base ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                    <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>{statusText[transaction.status]}</p>
                </div>
                <button onClick={() => onViewDetails(transaction)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="বিস্তারিত দেখুন">
                    <EyeIcon className="h-5 w-5" />
                </button>
            </div>
        </li>
    );
};

const SkeletonList = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);


const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchTransactions();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to load transactions", error);
            addToast('লেনদেন তালিকা লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const handleViewDetails = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setIsModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">লেনদেন হিস্টোরি</h1>
            {isLoading ? <SkeletonList /> : 
             transactions.length > 0 ? (
                 <ul className="space-y-3">
                    {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} onViewDetails={handleViewDetails} />)}
                </ul>
            ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">কোনো লেনদেন পাওয়া যায়নি</h3>
                    <p className="mt-1 text-[13px] text-slate-500">আপনি কোনো লেনদেন করলে তা এখানে দেখানো হবে।</p>
                </div>
            )}
             {selectedTransaction && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="লেনদেনের বিবরণ">
                   <TransactionDetailsModal details={selectedTransaction} onClose={() => setIsModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default TransactionHistory;