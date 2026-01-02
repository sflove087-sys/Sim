
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers, updateUserStatus, apiAdminRecharge } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { CurrencyBangladeshiIcon } from '@heroicons/react/24/outline';

const StatusBadge: React.FC<{ status: 'Active' | 'Blocked' }> = ({ status }) => {
    const isBlocked = status === 'Blocked';
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            isBlocked
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
        }`}>
            {isBlocked ? 'Blocked' : 'Active'}
        </span>
    );
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { addToast } = useToast();

    // State for recharge modal
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [selectedUserForRecharge, setSelectedUserForRecharge] = useState<User | null>(null);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeDescription, setRechargeDescription] = useState('');
    const [isRecharging, setIsRecharging] = useState(false);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllUsers();
            setUsers(data);
        } catch (error) {
            addToast("ইউজার লোড করা যায়নি।", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleStatusUpdate = async (userId: string, newStatus: 'Active' | 'Blocked') => {
        const actionText = newStatus === 'Blocked' ? 'ব্লক' : 'আনব্লক';
        if (!window.confirm(`আপনি কি এই ইউজারকে ${actionText} করতে নিশ্চিত?`)) {
            return;
        }

        setProcessingId(userId);
        try {
            await updateUserStatus(userId, newStatus);
            addToast(`ইউজার সফলভাবে ${actionText} করা হয়েছে।`, 'success');
            loadUsers(); // Refresh the list
        } catch (error) {
            const err = error as Error;
            addToast(err.message || `ইউজার ${actionText} করা যায়নি।`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenRechargeModal = (user: User) => {
        setSelectedUserForRecharge(user);
        setIsRechargeModalOpen(true);
    };

    const handleCloseRechargeModal = () => {
        setIsRechargeModalOpen(false);
        setSelectedUserForRecharge(null);
        setRechargeAmount('');
        setRechargeDescription('');
    };
    
    const handleRechargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(rechargeAmount);
        if (!selectedUserForRecharge || isNaN(amount) || amount <= 0) {
            addToast('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।', 'error');
            return;
        }
        
        setIsRecharging(true);
        try {
            const response = await apiAdminRecharge(selectedUserForRecharge.id, amount, rechargeDescription);
            addToast(response.message, 'success');
            handleCloseRechargeModal();
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'রিচার্জ করা যায়নি।', 'error');
        } finally {
            setIsRecharging(false);
        }
    };


    if (isLoading) {
        return <div className="text-center p-10">ইউজার লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">ইউজার ম্যানেজমেন্ট</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">নাম</th>
                            <th scope="col" className="px-6 py-3">ইমেইল</th>
                            <th scope="col" className="px-6 py-3">মোবাইল</th>
                            <th scope="col" className="px-6 py-3">আইপি ঠিকানা</th>
                            <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                            <th scope="col" className="px-6 py-3">একশন</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{user.mobile}</td>
                                <td className="px-6 py-4 font-mono">{user.ipAddress || 'N/A'}</td>
                                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                <td className="px-6 py-4 flex items-center space-x-4">
                                    <button
                                        onClick={() => handleStatusUpdate(user.id, user.status === 'Active' ? 'Blocked' : 'Active')}
                                        disabled={processingId === user.id}
                                        className={`font-medium disabled:opacity-50 disabled:cursor-wait ${
                                            user.status === 'Active' ? 'text-red-600 hover:underline dark:text-red-500' : 'text-green-600 hover:underline dark:text-green-500'
                                        }`}
                                    >
                                        {processingId === user.id ? 'প্রসেসিং...' : (user.status === 'Active' ? 'Block' : 'Unblock')}
                                    </button>
                                     <button
                                        onClick={() => handleOpenRechargeModal(user)}
                                        className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                        title="রিচার্জ করুন"
                                    >
                                        <CurrencyBangladeshiIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recharge Modal */}
            <Modal isOpen={isRechargeModalOpen} onClose={handleCloseRechargeModal} title={`রিচার্জ করুন: ${selectedUserForRecharge?.name}`}>
                <form onSubmit={handleRechargeSubmit} className="space-y-4">
                    <Input
                        id="rechargeAmount"
                        label="টাকার পরিমাণ"
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        placeholder="যেমন: ৫০০"
                        required
                    />
                    <Input
                        id="rechargeDescription"
                        label="বিবরণ (ঐচ্ছিক)"
                        type="text"
                        value={rechargeDescription}
                        onChange={(e) => setRechargeDescription(e.target.value)}
                        placeholder="যেমন: বোনাস, রিফান্ড, ইত্যাদি"
                    />
                    <div className="flex space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseRechargeModal} className="w-1/2">
                            বাতিল
                        </Button>
                        <Button type="submit" isLoading={isRecharging} className="w-1/2">
                            রিচার্জ করুন
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;