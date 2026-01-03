import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { fetchTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';

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
            <div className="text-right">
                <p className={`font-bold text-base ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>{statusText[transaction.status]}</p>
            </div>
        </li>
    );
};

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const loadTransactions = async () => {
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
        };
        loadTransactions();
    }, [addToast]);
    
    if (isLoading) {
        return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">লেনদেন হিস্টোরি</h1>
            {transactions.length > 0 ? (
                 <ul className="space-y-3">
                    {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                </ul>
            ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">কোনো লেনদেন পাওয়া যায়নি</h3>
                    <p className="mt-1 text-[13px] text-slate-500">আপনি কোনো লেনদেন করলে তা এখানে দেখানো হবে।</p>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
