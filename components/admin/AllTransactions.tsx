import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionStatus, TransactionType, User } from '../../types';
import { fetchAllTransactions, fetchAllUsers } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import Pagination from '../common/Pagination';
import Modal from '../common/Modal';
import { EyeIcon, UserCircleIcon, InformationCircleIcon, CalendarDaysIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

const PAGE_SIZE = 15;

const TransactionRow: React.FC<{ transaction: Transaction; userName: string; onViewDetails: (tx: Transaction) => void; }> = ({ transaction, userName, onViewDetails }) => {
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
         <tr className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
            <td data-label="তারিখ" className="px-6 py-4">{transaction.date}</td>
            <td data-label="ব্যবহারকারী" className="px-6 py-4">
                <p className="font-medium text-slate-800 dark:text-slate-200">{userName}</p>
                <span className="font-mono text-xs text-slate-500">{transaction.userId}</span>
            </td>
            <td data-label="বিবরণ" className="px-6 py-4">{transaction.description}</td>
            <td data-label="পরিমাণ" className={`px-6 py-4 font-semibold ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</td>
            <td data-label="স্ট্যাটাস" className="px-6 py-4">{statusText[transaction.status]}</td>
            <td data-label="একশন" className="px-6 py-4">
                <button onClick={() => onViewDetails(transaction)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    <EyeIcon className="h-5 w-5" />
                </button>
            </td>
        </tr>
    );
};

const AllTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ transactions: data, total }, usersData] = await Promise.all([
                fetchAllTransactions(currentPage, PAGE_SIZE),
                fetchAllUsers(1, 10000)
            ]);
            setTransactions(data);
            setTotalTransactions(total);
            setUserMap(new Map(usersData.users.map(u => [u.id, u])));
        } catch (error) {
            console.error("Failed to load all transactions or users", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);
    
    const handleViewDetails = (tx: Transaction) => {
        setSelectedTx(tx);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-200">সকল লেনদেনের তালিকা</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-20"><Spinner size="lg" /></div>
                    ) : (
                        <table className="responsive-table w-full min-w-[800px] text-xs text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">তারিখ</th>
                                    <th scope="col" className="px-6 py-3">ব্যবহারকারী</th>
                                    <th scope="col" className="px-6 py-3">বিবরণ</th>
                                    <th scope="col" className="px-6 py-3">পরিমাণ</th>
                                    <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                                    <th scope="col" className="px-6 py-3">একশন</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <TransactionRow key={tx.id} transaction={tx} userName={userMap.get(tx.userId || '')?.name || 'অজানা'} onViewDetails={handleViewDetails} />
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!isLoading && transactions.length === 0 && <p className="text-center p-6 text-xs text-slate-500">কোনো লেনদেন পাওয়া যায়নি।</p>}
                </div>
                 {!isLoading && totalTransactions > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="লেনদেনের বিবরণ">
                {selectedTx && (
                     <div className="space-y-4">
                        {(() => {
                            const txUser = selectedTx.userId ? userMap.get(selectedTx.userId) : null;
                            if (txUser) {
                                return (
                                    <div className="pb-3 mb-3 border-b dark:border-slate-600">
                                        <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">ব্যবহারকারী</h4>
                                        <div className="flex items-center space-x-3">
                                            {txUser.photoUrl ? (
                                                <img src={txUser.photoUrl} alt={txUser.name} className="h-10 w-10 rounded-full object-cover"/>
                                            ) : (
                                                <UserCircleIcon className="h-10 w-10 text-slate-300 dark:text-slate-600"/>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{txUser.name}</p>
                                                <p className="text-xs text-slate-500">{txUser.mobile}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        
                        {(() => {
                            const details = selectedTx;
                            const typeStyles = { [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400', [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400', [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400' };
                            const statusText = { [TransactionStatus.PENDING]: 'পেন্ডিং', [TransactionStatus.COMPLETED]: 'কমপ্লিট', [TransactionStatus.FAILED]: 'ব্যর্থ' };
                            const statusStyles = { [TransactionStatus.COMPLETED]: 'text-green-500', [TransactionStatus.PENDING]: 'text-yellow-500', [TransactionStatus.FAILED]: 'text-red-500' };
                            const sign = details.type === TransactionType.DEBIT ? '-' : '+';
                            return (
                                <>
                                    <div className={`p-4 rounded-xl bg-gradient-to-r ${details.type === TransactionType.DEBIT ? 'from-red-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700' : 'from-green-50 to-teal-50 dark:from-slate-700/50 dark:to-slate-700'}`}>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">পরিমাণ</p>
                                        <p className={`text-4xl font-bold ${typeStyles[details.type]}`}>{sign}৳{toBengaliNumber(details.amount.toFixed(2))}</p>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start space-x-3"><InformationCircleIcon className="h-5 w-5 mt-0.5 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">বিবরণ</p><p className="font-semibold text-[15px]">{details.description}</p></div></div>
                                        <div className="flex items-start space-x-3"><CalendarDaysIcon className="h-5 w-5 mt-0.5 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">তারিখ ও আইডি</p><p className="font-semibold text-[15px]">{details.date}</p><p className="font-mono text-xs text-slate-400">{details.id}</p></div></div>
                                        <div className="flex items-start space-x-3"><CheckBadgeIcon className="h-5 w-5 mt-0.5 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">স্ট্যাটাস</p><p className={`font-semibold text-[15px] ${statusStyles[details.status]}`}>{statusText[details.status]}</p></div></div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AllTransactions;