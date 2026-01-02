import React, { useState, useEffect, useCallback } from 'react';
import { AdminTransaction, User } from '../../types';
// FIX: The function `fetchPendingTransactions` does not exist. It has been replaced with `fetchAllMoneyRequests`.
import { fetchAllMoneyRequests, approveTransaction, rejectTransaction, fetchAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import Button from '../common/Button';

const VerifyTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    type ConfirmationState = { action: 'approve' | 'reject'; tx: AdminTransaction } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);

    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // FIX: Replaced `fetchPendingTransactions` with `fetchAllMoneyRequests` and added filtering for pending transactions.
            const [transactionsData, usersData] = await Promise.all([
                fetchAllMoneyRequests(),
                fetchAllUsers()
            ]);
            setTransactions(transactionsData.filter(tx => tx.status === 'Pending'));
            setUsers(usersData);
        } catch (error) {
            addToast('পেন্ডিং লেনদেন বা ইউজার লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'অজানা';
    
    const handleViewUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setSelectedUser(user);
            setIsUserModalOpen(true);
        } else {
            addToast('ইউজার খুঁজে পাওয়া যায়নি।', 'error');
        }
    };

    const openConfirmationModal = (action: 'approve' | 'reject', tx: AdminTransaction) => {
        setConfirmationState({ action, tx });
    };

    const handleConfirmAction = async () => {
        if (!confirmationState) return;

        const { action, tx } = confirmationState;
        setProcessingId(tx.requestId);

        try {
            if (action === 'approve') {
                await approveTransaction(tx.requestId);
                addToast('অনুরোধটি সফলভাবে অনুমোদন করা হয়েছে।', 'success');
            } else {
                await rejectTransaction(tx.requestId);
                addToast('অনুরোধটি সফলভাবে বাতিল করা হয়েছে।', 'success');
            }
            setConfirmationState(null); // Close modal on success
            loadData();
        } catch (error) {
            const err = error as Error;
            const actionText = action === 'approve' ? 'অনুমোদন' : 'বাতিল';
            addToast(`লেনদেন ${actionText} করা যায়নি: ${err.message}`, 'error');
            setConfirmationState(null);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">লেনদেন যাচাই করুন</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                 {isLoading ? (
                    <div className="flex justify-center items-center p-10"><Spinner size="lg" /></div>
                 ) : (
                    <table className="w-full min-w-[800px] text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">তারিখ</th>
                                <th scope="col" className="px-6 py-3">ব্যবহারকারীর নাম</th>
                                <th scope="col" className="px-6 py-3">পরিমাণ</th>
                                <th scope="col" className="px-6 py-3">পেমেন্ট পদ্ধতি</th>
                                <th scope="col" className="px-6 py-3">ট্রানজেকশন আইডি</th>
                                <th scope="col" className="px-6 py-3">একশন</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.requestId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                    <td className="px-6 py-4">{tx.date}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleViewUser(tx.userId)} className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none">
                                            {getUserName(tx.userId)}
                                        </button>
                                        <span className="block text-xs text-slate-400 font-mono">{tx.userId}</span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold">৳{tx.amount}</td>
                                    <td className="px-6 py-4">{tx.paymentMethod}</td>
                                    <td className="px-6 py-4 font-mono">{tx.transactionId}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button
                                            onClick={() => openConfirmationModal('approve', tx)}
                                            disabled={!!processingId}
                                            className="font-medium text-green-600 dark:text-green-500 hover:underline disabled:opacity-50 disabled:no-underline"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openConfirmationModal('reject', tx)}
                                            disabled={!!processingId}
                                            className="font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 disabled:no-underline"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 )}
                 {!isLoading && transactions.length === 0 && <p className="text-center p-6 text-slate-500">কোনো পেন্ডিং লেনদেন নেই।</p>}
            </div>

            {/* User Details Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="ইউজারের বিবরণ">
                {selectedUser && (
                    <div className="space-y-3 text-slate-600 dark:text-slate-300">
                        <p><strong>নাম:</strong> {selectedUser.name}</p>
                        <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p>
                        <p><strong>ইমেইল:</strong> {selectedUser.email}</p>
                        <p><strong>আইপি:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p>
                    </div>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="অনুরোধ নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                         <p className="text-slate-600 dark:text-slate-300">
                            আপনি কি <strong>{getUserName(confirmationState.tx.userId)}</strong> এর জন্য <strong>৳{confirmationState.tx.amount}</strong> টাকার অনুরোধটি <strong>{confirmationState.action === 'approve' ? 'অনুমোদন' : 'বাতিল'}</strong> করতে নিশ্চিত?
                        </p>
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setConfirmationState(null)} className="w-1/2">
                                ফিরে যান
                            </Button>
                            <Button 
                                type="button" 
                                variant={confirmationState.action === 'approve' ? 'primary' : 'danger'} 
                                onClick={handleConfirmAction} 
                                isLoading={processingId === confirmationState.tx.requestId} 
                                className="w-1/2"
                            >
                                {confirmationState.action === 'approve' ? 'অনুমোদন নিশ্চিত করুন' : 'বাতিল নিশ্চিত করুন'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VerifyTransactions;
