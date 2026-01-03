import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { fetchAllTransactions } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import Pagination from '../common/Pagination';

const PAGE_SIZE = 15;

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
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
    const sign = transaction.type === TransactionType.DEBIT ? '-' : '+';

    return (
         <tr className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
            <td className="px-6 py-4">{transaction.date}</td>
            <td className="px-6 py-4 font-mono text-xs">{transaction.userId}</td>
            <td className="px-6 py-4">{transaction.description}</td>
            <td className={`px-6 py-4 font-semibold ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</td>
            <td className="px-6 py-4">{statusText[transaction.status]}</td>
        </tr>
    );
};

const AllTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);

    useEffect(() => {
        const loadTransactions = async () => {
            setIsLoading(true);
            try {
                const { transactions: data, total } = await fetchAllTransactions(currentPage, PAGE_SIZE);
                setTransactions(data);
                setTotalTransactions(total);
            } catch (error) {
                console.error("Failed to load all transactions", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTransactions();
    }, [currentPage]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">সকল লেনদেনের তালিকা</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-20"><Spinner size="lg" /></div>
                    ) : (
                        <table className="w-full min-w-[800px] text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">তারিখ</th>
                                    <th scope="col" className="px-6 py-3">ইউজার আইডি</th>
                                    <th scope="col" className="px-6 py-3">বিবরণ</th>
                                    <th scope="col" className="px-6 py-3">পরিমাণ</th>
                                    <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <TransactionRow key={tx.id} transaction={tx} />
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!isLoading && transactions.length === 0 && <p className="text-center p-6 text-slate-500">কোনো লেনদেন পাওয়া যায়নি।</p>}
                </div>
                 {!isLoading && totalTransactions > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>
        </div>
    );
};

export default AllTransactions;
