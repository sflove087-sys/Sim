import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionStatus, TransactionType, User } from '../../types';
import { fetchAllTransactions, fetchAllUsers } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import Pagination from '../common/Pagination';
import Modal from '../common/Modal';
import { EyeIcon, UserCircleIcon, InformationCircleIcon, CalendarDaysIcon, CheckBadgeIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';

const PAGE_SIZE = 10; // Changed to 10 for better card view

const TransactionCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="flex items-center gap-3 md:w-48">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="md:w-32 space-y-2">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
            </div>
            <div className="md:w-16 flex justify-end">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
        </div>
    </div>
);

const TransactionCard: React.FC<{ transaction: Transaction; user: User | undefined; onViewDetails: (tx: Transaction) => void; }> = ({ transaction, user, onViewDetails }) => {
    const typeStyles = {
        [TransactionType.CREDIT]: 'text-green-600 dark:text-green-400',
        [TransactionType.DEBIT]: 'text-red-600 dark:text-red-400',
        [TransactionType.BONUS]: 'text-blue-600 dark:text-blue-400',
    };
    const iconStyles = {
        [TransactionType.CREDIT]: 'text-green-500',
        [TransactionType.DEBIT]: 'text-red-500',
        [TransactionType.BONUS]: 'text-blue-500',
    };
    const statusText = {
        [TransactionStatus.PENDING]: 'পেন্ডিং',
        [TransactionStatus.COMPLETED]: 'কমপ্লিট',
        [TransactionStatus.FAILED]: 'ব্যর্থ',
    };
    const statusStyles = {
        [TransactionStatus.COMPLETED]: 'text-green-600',
        [TransactionStatus.PENDING]: 'text-yellow-600',
        [TransactionStatus.FAILED]: 'text-red-600',
    };
    const sign = transaction.type === TransactionType.DEBIT ? '-' : '+';
    const Icon = transaction.type === TransactionType.DEBIT ? ArrowDownCircleIcon : ArrowUpCircleIcon;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:border-indigo-500/50 border border-transparent">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Icon className={`h-10 w-10 flex-shrink-0 ${iconStyles[transaction.type]}`} />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={transaction.description}>{transaction.description}</p>
                        <p className="text-xs text-slate-500">{transaction.date}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:w-48 border-t md:border-none pt-3 md:pt-0">
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    )}
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{user?.name || 'অজানা'}</p>
                        <p className="text-xs font-mono text-slate-500">{transaction.userId}</p>
                    </div>
                </div>

                <div className="text-left md:text-right md:w-32">
                    <p className={`font-bold text-lg ${typeStyles[transaction.type]}`}>{sign}৳{toBengaliNumber(transaction.amount.toFixed(2))}</p>
                    <p className={`text-xs font-medium ${statusStyles[transaction.status]}`}>{statusText[transaction.status]}</p>
                </div>

                <div className="flex justify-end md:w-16">
                    <button onClick={() => onViewDetails(transaction)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="বিস্তারিত দেখুন">
                        <EyeIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
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
            
            <div className="space-y-4">
                {isLoading ? (
                    [...Array(PAGE_SIZE)].map((_, i) => <TransactionCardSkeleton key={i} />)
                ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <TransactionCard key={tx.id} transaction={tx} user={userMap.get(tx.userId || '')} onViewDetails={handleViewDetails} />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <p className="text-slate-500">কোনো লেনদেন পাওয়া যায়নি।</p>
                    </div>
                )}
            </div>

            {!isLoading && totalTransactions > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="লেনদেনের বিবরণ">
                {selectedTx && (
                     <div className="space-y-4">
                        {(() => {
                            const txUser = selectedTx.userId ? userMap.get(selectedTx.userId) : null;
                            if (txUser) {
                                return (
                                     <div className="pb-4 mb-4 border-b dark:border-slate-600">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            {txUser.photoUrl ? (
                                                <img src={txUser.photoUrl} alt={txUser.name} className="h-16 w-16 rounded-full object-cover shadow-md"/>
                                            ) : (
                                                <UserCircleIcon className="h-16 w-16 text-slate-300 dark:text-slate-600"/>
                                            )}
                                            <div>
                                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{txUser.name}</p>
                                                <p className="text-sm text-slate-500">{txUser.mobile}</p>
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