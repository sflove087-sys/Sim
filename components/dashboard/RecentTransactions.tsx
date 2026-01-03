
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Page, TransactionStatus } from '../../types';
import { fetchTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import { ArrowLongRightIcon, EyeIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';

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

    const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
        const sign = transaction.type === TransactionType.DEBIT ? '-' : '+';
        return (
            <li className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">{transaction.description}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-right">
                        <p className={`font-bold text-lg ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                         {transaction.status && (
                            <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>
                                {statusText[transaction.status]}
                            </p>
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
                        className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        সব দেখুন <ArrowLongRightIcon className="h-5 w-5 ml-1"/>
                    </button>
                </div>

                {isLoading ? (
                     <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md"></div>)}
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
                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <p><strong>ট্রানজেকশন আইডি:</strong> <span className="font-mono">{selectedTransaction.id}</span></p>
                        <p><strong>তারিখ:</strong> {selectedTransaction.date}</p>
                        <p><strong>বিবরণ:</strong> {selectedTransaction.description}</p>
                        <p><strong>ধরন:</strong> {selectedTransaction.type}</p>
                        <p><strong>পরিমাণ:</strong> <span className={`font-bold ${typeStyles[selectedTransaction.type]}`}>
                            {selectedTransaction.type === TransactionType.DEBIT ? '-' : '+'}৳{toBengaliNumber(selectedTransaction.amount.toFixed(2))}
                        </span></p>
                        <p><strong>স্ট্যাটাস:</strong> <span className={`font-semibold ${statusStyles[selectedTransaction.status]}`}>{statusText[selectedTransaction.status]}</span></p>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default RecentTransactions;
