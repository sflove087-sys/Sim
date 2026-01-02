
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers, updateUserStatus } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { toBengaliNumber } from '../../utils/formatters';

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
    
    type ConfirmationState = { user: User; newStatus: 'Active' | 'Blocked' } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);

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

    const handleConfirmStatusUpdate = async () => {
        if (!confirmationState) return;

        const { user, newStatus } = confirmationState;
        const actionText = newStatus === 'Blocked' ? 'ব্লক' : 'আনব্লক';

        setProcessingId(user.id);
        setConfirmationState(null); 

        try {
            await updateUserStatus(user.id, newStatus);
            addToast(`ইউজার সফলভাবে ${actionText} করা হয়েছে।`, 'success');
            loadUsers(); 
        } catch (error) {
            const err = error as Error;
            addToast(err.message || `ইউজার ${actionText} করা যায়নি।`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">ইউজার লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">ইউজার ম্যানেজমেন্ট</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">নাম</th>
                            <th scope="col" className="px-6 py-3">ইমেইল</th>
                            <th scope="col" className="px-6 py-3">মোবাইল</th>
                            <th scope="col" className="px-6 py-3">ওয়ালেট ব্যালেন্স</th>
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
                                <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                    {user.balance !== undefined ? `৳${toBengaliNumber(user.balance.toFixed(2))}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setConfirmationState({ user, newStatus: user.status === 'Active' ? 'Blocked' : 'Active' })}
                                        disabled={processingId === user.id}
                                        className={`font-medium disabled:opacity-50 disabled:cursor-wait ${
                                            user.status === 'Active' ? 'text-red-600 hover:underline dark:text-red-500' : 'text-green-600 hover:underline dark:text-green-500'
                                        }`}
                                    >
                                        {processingId === user.id ? 'প্রসেসিং...' : (user.status === 'Active' ? 'ব্লক করুন' : 'আনব্লক করুন')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="স্ট্যাটাস পরিবর্তন নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">
                            আপনি কি সত্যিই ব্যবহারকারী <strong>{confirmationState.user.name}</strong> কে <strong>{confirmationState.newStatus === 'Blocked' ? 'ব্লক' : 'আনব্লক'}</strong> করতে চান?
                        </p>
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setConfirmationState(null)} className="w-1/2">
                                ফিরে যান
                            </Button>
                            <Button 
                                type="button" 
                                variant={confirmationState.newStatus === 'Blocked' ? 'danger' : 'primary'} 
                                onClick={handleConfirmStatusUpdate} 
                                isLoading={processingId === confirmationState.user.id}
                                className="w-1/2"
                            >
                                {confirmationState.newStatus === 'Blocked' ? 'হ্যাঁ, ব্লক করুন' : 'হ্যাঁ, আনব্লক করুন'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;