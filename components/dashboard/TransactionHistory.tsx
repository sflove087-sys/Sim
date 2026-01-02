
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { fetchTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const typeStyles = {
        [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400',
        [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400',
        [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400',
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

    return (
        <li className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{transaction.description}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.date}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>{statusText[transaction.status]}</p>
            </div>
        </li>
    );
};

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const data = await fetchTransactions();
                setTransactions(data);
            } catch (error) {
                console.error("Failed to load transactions", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTransactions();
    }, []);
    
    if (isLoading) {
        return <div className="text-center p-10">লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">লেনদেন হিস্টোরি</h1>
            {transactions.length > 0 ? (
                 <ul className="space-y-3">
                    {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                </ul>
            ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <p className="text-slate-500">কোনো লেনদেন পাওয়া যায়নি।</p>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
