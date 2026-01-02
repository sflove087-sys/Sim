
import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction, AdminTransaction } from '../../types';
import { 
    fetchAllUsers, 
    apiAdminRecharge, 
    apiFetchAdminRecharges,
    fetchPendingTransactions,
    approveTransaction,
    rejectTransaction
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { toBengaliNumber } from '../../utils/formatters';

const AdminRecharge: React.FC = () => {
    // State for direct recharge
    const [users, setUsers] = useState<User[]>([]);
    const [rechargeHistory, setRechargeHistory] = useState<Transaction[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for verifying user requests (from VerifyTransactions)
    const [pendingTxs, setPendingTxs] = useState<AdminTransaction[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    type ConfirmationState = { action: 'approve' | 'reject'; tx: AdminTransaction } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);

    // General state
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'অজানা ব্যবহারকারী';

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersData, historyData, pendingTxsData] = await Promise.all([
                fetchAllUsers(),
                apiFetchAdminRecharges(),
                fetchPendingTransactions()
            ]);
            setUsers(usersData);
            setRechargeHistory(historyData);
            setPendingTxs(pendingTxsData);
        } catch (error) {
            addToast('প্রয়োজনীয় তথ্য লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleRechargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!selectedUserId || isNaN(numericAmount) || numericAmount <= 0) {
            addToast('অনুগ্রহ করে সঠিক ব্যবহারকারী এবং টাকার পরিমাণ দিন।', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiAdminRecharge(selectedUserId, numericAmount, description);
            addToast(response.message, 'success');
            setSelectedUserId('');
            setAmount('');
            setDescription('');
            loadInitialData();
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Handlers from VerifyTransactions ---
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
            setConfirmationState(null);
            loadInitialData();
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
        <div className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">টাকা যোগ ও রিচার্জ</h1>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">ব্যবহারকারীকে সরাসরি রিচার্জ করুন</h2>
                <form onSubmit={handleRechargeSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="user" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            ব্যবহারকারী বাছাই করুন
                        </label>
                        <select
                            id="user"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="" disabled>-- একজন ব্যবহারকারী নির্বাচন করুন --</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name} - {user.mobile}</option>
                            ))}
                        </select>
                    </div>
                    <Input id="amount" label="টাকার পরিমাণ (৳)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 500" required />
                    <Input id="description" label="বিবরণ (ঐচ্ছিক)" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="যেমন: বোনাস, রিফান্ড, ইত্যাদি" />
                    <div className="pt-2">
                        <Button type="submit" isLoading={isSubmitting} disabled={isLoading}>রিচার্জ করুন</Button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300 px-2">ব্যবহারকারীর টাকা যোগ করার অনুরোধ</h2>
                <div className="overflow-x-auto">
                    {isLoading ? (<div className="flex justify-center p-10"><Spinner size="lg" /></div>) : 
                    pendingTxs.length > 0 ? (
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
                                {pendingTxs.map((tx) => (
                                    <tr key={tx.requestId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td className="px-6 py-4">{tx.date}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleViewUser(tx.userId)} className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none">{getUserName(tx.userId)}</button>
                                            <span className="block text-xs text-slate-400 font-mono">{tx.userId}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">৳{tx.amount}</td>
                                        <td className="px-6 py-4">{tx.paymentMethod}</td>
                                        <td className="px-6 py-4 font-mono">{tx.transactionId}</td>
                                        <td className="px-6 py-4 space-x-2">
                                            <button onClick={() => openConfirmationModal('approve', tx)} disabled={!!processingId} className="font-medium text-green-600 dark:text-green-500 hover:underline disabled:opacity-50 disabled:no-underline">Approve</button>
                                            <button onClick={() => openConfirmationModal('reject', tx)} disabled={!!processingId} className="font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 disabled:no-underline">Reject</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p className="text-center p-6 text-slate-500">কোনো পেন্ডিং লেনদেন নেই।</p> )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300 px-2">সরাসরি রিচার্জের ইতিহাস</h2>
                <div className="overflow-x-auto">
                    {isLoading ? (<div className="flex justify-center p-10"><Spinner size="lg" /></div>) : 
                    rechargeHistory.length > 0 ? (
                        <table className="w-full min-w-[700px] text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">তারিখ</th>
                                    <th scope="col" className="px-6 py-3">ব্যবহারকারী</th>
                                    <th scope="col" className="px-6 py-3">বিবরণ</th>
                                    <th scope="col" className="px-6 py-3">পরিমাণ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rechargeHistory.map((tx) => (
                                    <tr key={tx.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td className="px-6 py-4">{tx.date}</td>
                                        <td className="px-6 py-4">{getUserName(tx.userId || '')}<span className="block text-xs font-mono text-slate-400">{tx.userId}</span></td>
                                        <td className="px-6 py-4">{tx.description}</td>
                                        <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">+৳{toBengaliNumber(tx.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p className="text-center p-6 text-slate-500">কোনো রিচার্জের ইতিহাস পাওয়া যায়নি।</p> )}
                </div>
            </div>

             {/* Modals from VerifyTransactions */}
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
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="অনুরোধ নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                         <p className="text-slate-600 dark:text-slate-300">আপনি কি <strong>{getUserName(confirmationState.tx.userId)}</strong> এর জন্য <strong>৳{confirmationState.tx.amount}</strong> টাকার অনুরোধটি <strong>{confirmationState.action === 'approve' ? 'অনুমোদন' : 'বাতিল'}</strong> করতে নিশ্চিত?</p>
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setConfirmationState(null)} className="w-1/2">ফিরে যান</Button>
                            <Button type="button" variant={confirmationState.action === 'approve' ? 'primary' : 'danger'} onClick={handleConfirmAction} isLoading={processingId === confirmationState.tx.requestId} className="w-1/2">{confirmationState.action === 'approve' ? 'অনুমোদন নিশ্চিত করুন' : 'বাতিল নিশ্চিত করুন'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminRecharge;
