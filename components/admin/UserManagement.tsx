import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers, updateUserStatus } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { toBengaliNumber } from '../../utils/formatters';
import { EyeIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Pagination from '../common/Pagination';
import Spinner from '../common/Spinner';

const PAGE_SIZE = 10;

const StatusBadge: React.FC<{ status: 'Active' | 'Blocked' }> = ({ status }) => {
    const isBlocked = status === 'Blocked';
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            isBlocked
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
        }`}>
            {isBlocked ? 'ব্লকড' : 'একটিভ'}
        </span>
    );
};

// Helper to determine if a user is online
const isOnline = (lastSeen?: string): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    // Consider online if last seen was within the last 2 minutes
    const twoMinutesInMillis = 2 * 60 * 1000;
    return (now.getTime() - lastSeenDate.getTime()) < twoMinutesInMillis;
};


const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { addToast } = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
    
    type ConfirmationState = { user: User; newStatus: 'Active' | 'Blocked' } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);

    const loadUsers = useCallback(async (isRefresh: boolean = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            const { users: data, total } = await fetchAllUsers(currentPage, PAGE_SIZE);
            setUsers(data);
            setTotalUsers(total);
        } catch (error) {
             addToast("ইউজার লোড করা যায়নি।", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers, currentPage]);

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setIsUserDetailsModalOpen(true);
    };

    const handleConfirmStatusUpdate = async () => {
        if (!confirmationState) return;

        const { user, newStatus } = confirmationState;
        const actionText = newStatus === 'Blocked' ? 'ব্লক' : 'আনব্লক';

        setProcessingId(user.id);
        setConfirmationState(null); 

        try {
            await updateUserStatus(user.id, newStatus);
            addToast(`ইউজার সফলভাবে ${actionText} করা হয়েছে।`, 'success');
            loadUsers(true); 
        } catch (error) {
            const err = error as Error;
            addToast(err.message || `ইউজার ${actionText} করা যায়নি।`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">ইউজার ম্যানেজমেন্ট</h1>
                <button 
                    onClick={() => loadUsers(true)}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="তালিকা রিফ্রেশ করুন"
                    disabled={isLoading}
                >
                    <ArrowPathIcon className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <div className="overflow-x-auto">
                    {isLoading ? ( <div className="flex justify-center items-center p-20"><Spinner size="lg"/></div> ) : (
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
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center space-x-2">
                                                <div className="relative flex-shrink-0">
                                                    {user.photoUrl ? (
                                                        <img src={user.photoUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover"/>
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span 
                                                        className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isOnline(user.lastSeen) ? 'bg-green-500' : 'bg-red-500'}`} 
                                                        title={isOnline(user.lastSeen) ? 'অনলাইন' : 'অফলাইন'}
                                                    />
                                                </div>
                                                <span className="text-base">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{user.mobile}</td>
                                        <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                            {user.balance !== undefined ? `৳${toBengaliNumber(user.balance.toFixed(2))}` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            <button
                                                onClick={() => handleViewUser(user)}
                                                className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                                title="ইউজারের বিবরণ দেখুন"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
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
                    )}
                </div>
                 {!isLoading && totalUsers > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>
            
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="স্ট্যাটাস পরিবর্তন নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                        <p className="text-[13px] text-slate-600 dark:text-slate-300">
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

            <Modal isOpen={isUserDetailsModalOpen} onClose={() => setIsUserDetailsModalOpen(false)} title="ইউজারের বিবরণ">
                {selectedUser && (
                    <div className="space-y-3 text-[13px] text-slate-600 dark:text-slate-300">
                        <p><strong>নাম:</strong> {selectedUser.name}</p>
                        <p><strong>ইউজার আইডি:</strong> <span className="font-mono text-sm">{selectedUser.id}</span></p>
                        <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p>
                        <p><strong>ইমেইল:</strong> {selectedUser.email}</p>
                        <p><strong>ব্যালেন্স:</strong> ৳{toBengaliNumber(selectedUser.balance !== undefined ? selectedUser.balance.toFixed(2) : '0.00')}</p>
                        <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedUser.status} /></p>
                        <p><strong>আইপি ঠিকানা:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p>
                        <p><strong>সর্বশেষ সক্রিয়:</strong> {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString('bn-BD') : 'কখনো না'}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
