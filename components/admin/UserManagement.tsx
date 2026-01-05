import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers, updateUserStatus, apiAdminSendEmail } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { toBengaliNumber } from '../../utils/formatters';
import { EyeIcon, ArrowPathIcon, EnvelopeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Pagination from '../common/Pagination';
import Input from '../common/Input';
import LoadingModal from '../common/LoadingModal';

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

const UserCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md animate-pulse flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
        <div className="flex justify-between items-center md:space-x-8">
            <div>
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
             <div>
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
        </div>
        <div className="flex items-center space-x-2 justify-end">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        </div>
    </div>
);


const UserCard: React.FC<{
    user: User;
    onView: (user: User) => void;
    onEmail: (user: User) => void;
    onStatusChange: (user: User) => void;
    processingId: string | null;
}> = ({ user, onView, onEmail, onStatusChange, processingId }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-shadow hover:shadow-lg flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-shrink-0">
                    {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="h-12 w-12 rounded-full object-cover"/>
                    ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-lg">
                            {user.name.charAt(0)}
                        </div>
                    )}
                    <span 
                        className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 ${isOnline(user.lastSeen) ? 'bg-green-500' : 'bg-slate-400'}`} 
                        title={isOnline(user.lastSeen) ? 'অনলাইন' : 'অফলাইন'}
                    />
                </div>
                <div>
                    <p className="font-bold text-base text-slate-800 dark:text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
            </div>

            <div className="flex justify-between md:items-center md:space-x-8 text-xs">
                 <div className="text-left">
                    <p className="text-slate-500 dark:text-slate-400">ব্যালেন্স</p>
                    <p className="font-semibold text-base text-indigo-600 dark:text-indigo-400">
                        {user.balance !== undefined ? `৳${toBengaliNumber(user.balance.toFixed(2))}` : 'N/A'}
                    </p>
                </div>
                <div className="text-right md:text-left">
                     <p className="text-slate-500 dark:text-slate-400 mb-1">স্ট্যাটাস</p>
                    <StatusBadge status={user.status} />
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t md:border-none pt-3 md:pt-0">
                <button
                    onClick={() => onView(user)}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="ইউজারের বিবরণ দেখুন"
                >
                    <EyeIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onEmail(user)}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="ইমেইল পাঠান"
                >
                    <EnvelopeIcon className="h-5 w-5" />
                </button>
                 <button
                    onClick={() => onStatusChange(user)}
                    disabled={processingId === user.id}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
                        user.status === 'Active' 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30'
                    }`}
                >
                    <div className="flex items-center">
                        {processingId === user.id 
                            ? '...' 
                            : user.status === 'Active' 
                            ? <><XMarkIcon className="h-4 w-4 mr-1"/><span>ব্লক</span></>
                            : <><CheckIcon className="h-4 w-4 mr-1"/><span>আনব্লক</span></>
                        }
                    </div>
                </button>
            </div>
        </div>
    );
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

    // Email Modal State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTargetUser, setEmailTargetUser] = useState<User | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    
    // Email Modal Handlers
    const handleOpenEmailModal = (user: User) => {
        if (!user.email) {
            addToast('এই ব্যবহারকারীর কোনো নিবন্ধিত ইমেইল নেই।', 'error');
            return;
        }
        setEmailTargetUser(user);
        setIsEmailModalOpen(true);
    };

    const handleCloseEmailModal = () => {
        setIsEmailModalOpen(false);
        setEmailTargetUser(null);
        setEmailSubject('');
        setEmailBody('');
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailTargetUser || !emailSubject.trim() || !emailBody.trim()) {
            addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'error');
            return;
        }
        setIsSendingEmail(true);
        try {
            await apiAdminSendEmail(emailTargetUser.id, emailSubject, emailBody);
            addToast(`ইমেইল সফলভাবে পাঠানো হয়েছে।`, 'success');
            handleCloseEmailModal();
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };


    return (
        <div className="space-y-6">
            <LoadingModal isOpen={isSendingEmail} />
            <div className="flex justify-between items-center">
                <h1 className="text-base font-bold text-slate-800 dark:text-slate-200">ইউজার ম্যানেজমেন্ট</h1>
                <button 
                    onClick={() => loadUsers(true)}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="তালিকা রিফ্রেশ করুন"
                    disabled={isLoading}
                >
                    <ArrowPathIcon className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            <div className="space-y-4">
                {isLoading ? (
                    [...Array(PAGE_SIZE)].map((_, i) => <UserCardSkeleton key={i} />)
                ) : (
                    users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onView={handleViewUser}
                            onEmail={handleOpenEmailModal}
                            onStatusChange={(u) => setConfirmationState({ user: u, newStatus: u.status === 'Active' ? 'Blocked' : 'Active' })}
                            processingId={processingId}
                        />
                    ))
                )}
            </div>
            
            {!isLoading && totalUsers > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="স্ট্যাটাস পরিবর্তন নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
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
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                        <p><strong>নাম:</strong> {selectedUser.name}</p>
                        <p><strong>ইউজার আইডি:</strong> <span className="font-mono">{selectedUser.id}</span></p>
                        <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p>
                        <p><strong>ইমেইল:</strong> {selectedUser.email}</p>
                        <p><strong>ব্যালেন্স:</strong> ৳{toBengaliNumber(selectedUser.balance !== undefined ? selectedUser.balance.toFixed(2) : '0.00')}</p>
                        <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedUser.status} /></p>
                        <p><strong>আইপি ঠিকানা:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p>
                        <p><strong>সর্বশেষ সক্রিয়:</strong> {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString('bn-BD') : 'কখনো না'}</p>
                    </div>
                )}
            </Modal>

             <Modal isOpen={isEmailModalOpen} onClose={handleCloseEmailModal} title={`ইমেইল পাঠান: ${emailTargetUser?.name}`}>
                {emailTargetUser && (
                    <form onSubmit={handleSendEmail} className="space-y-4">
                        <p className="text-sm">প্রাপক: <span className="font-semibold">{emailTargetUser.email}</span></p>
                        <Input id="subject" label="বিষয়" type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} required />
                        <div>
                            <label htmlFor="body" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">বার্তা</label>
                            <textarea id="body" rows={5} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" required></textarea>
                        </div>
                        <div className="flex space-x-3 pt-2">
                            <Button type="button" variant="secondary" onClick={handleCloseEmailModal} className="w-1/2">বাতিল</Button>
                            <Button type="submit" isLoading={isSendingEmail} className="w-1/2">ইমেইল পাঠান</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;