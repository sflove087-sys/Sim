import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AdminTransaction } from '../../types';
import { 
    fetchAllUsers, 
    fetchAllMoneyRequests,
    approveTransaction,
    rejectTransaction,
    apiReverifyTransaction
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { toBengaliNumber } from '../../utils/formatters';
import { EyeIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ShieldExclamationIcon, ArrowPathIcon, UserCircleIcon, BanknotesIcon, DevicePhoneMobileIcon, KeyIcon } from '@heroicons/react/24/solid';
import VerificationProgressBar from '../common/VerificationProgressBar';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Verifying';

const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
    const statusStyles = {
        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Verifying: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };
    const statusText = {
        Pending: 'পেন্ডিং',
        Approved: 'অনুমোদিত',
        Rejected: 'বাতিল',
        Verifying: 'যাচাই চলছে',
    }
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {statusText[status]}
        </span>
    );
};

const VerificationStatusBadge: React.FC<{ tx: AdminTransaction }> = ({ tx }) => {
    const { verificationStatus, smsAmount, smsCompany, smsSenderNumber, status, verificationAttempts } = tx;

    if (status === 'Verifying' && !verificationStatus) {
        return (
            <span 
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                title={`যাচাইয়ের চেষ্টা: ${toBengaliNumber(verificationAttempts || 0)}/৫`}
            >
                <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                যাচাই চলছে...
            </span>
        );
    }
    
    if (!verificationStatus) return <span className="text-xs text-slate-400">N/A</span>;

    const statusInfo = {
        Verified: { text: 'ভেরিফাইড', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', tooltip: 'লেনদেনটি SMS তালিকার সাথে মিলেছে।', icon: CheckCircleIcon },
        Mismatch: { text: 'অমিল', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', tooltip: '', icon: ExclamationTriangleIcon },
        'Not Found': { text: 'পাওয়া যায়নি', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', tooltip: 'এই ট্রানজেকশন আইডি SMS তালিকায় পাওয়া যায়নি।', icon: XCircleIcon },
        Duplicate: { text: 'ব্যবহৃত', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', tooltip: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে অনুমোদিত হয়েছে।', icon: ShieldExclamationIcon },
    };

    const info = statusInfo[verificationStatus];
    if (!info) return null;
    const Icon = info.icon;


    if (verificationStatus === 'Mismatch') {
        const details = [];
        if (smsAmount !== undefined && smsAmount !== tx.amount) details.push(`পরিমাণ (SMS: ৳${toBengaliNumber(smsAmount)})`);
        if (smsSenderNumber && tx.senderNumber && !smsSenderNumber.endsWith(tx.senderNumber)) details.push(`নম্বর (SMS: ...${smsSenderNumber.slice(-4)})`);
        info.tooltip = details.length > 0 ? `অমিল: ${details.join(', ')}` : 'তথ্যে অমিল রয়েছে।';
    }

    return (
        <span 
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full relative group ${info.color}`}
            title={info.tooltip}
        >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {info.text}
        </span>
    );
};

const RequestCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1.5"></div>
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            {[...Array(4)].map((_, i) => (
                <div key={i}>
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-1.5"></div>
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            ))}
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
             <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
             <div className="flex items-center space-x-2">
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
             </div>
        </div>
    </div>
);


const RequestCard: React.FC<{
    tx: AdminTransaction;
    user: User | undefined;
    onViewUser: (userId: string) => void;
    onApprove: (tx: AdminTransaction) => void;
    onReject: (tx: AdminTransaction) => void;
    onReverify: (tx: AdminTransaction) => void;
    processingId: string | null;
    reverifyingId: string | null;
}> = ({ tx, user, onViewUser, onApprove, onReject, onReverify, processingId, reverifyingId }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 transition-all hover:shadow-lg border border-transparent hover:border-indigo-500/30">
            {/* Header */}
            <div className="flex justify-between items-start pb-3">
                <button onClick={() => onViewUser(tx.userId)} className="flex items-center space-x-3 group">
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover"/>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-base">
                            {user?.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-base text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.name || 'অজানা'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tx.userId}</p>
                    </div>
                </button>
                <StatusBadge status={tx.status} />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-700/50">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">পরিমাণ</p>
                    <p className="font-bold text-xl text-indigo-600 dark:text-indigo-400">৳{toBengaliNumber(tx.amount)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">পদ্ধতি</p>
                    <p className="font-semibold text-base text-slate-700 dark:text-slate-300">{tx.paymentMethod}</p>
                </div>
                 <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">প্রেরক নম্বর</p>
                    <p className="font-mono text-base text-slate-700 dark:text-slate-300">{tx.senderNumber}</p>
                </div>
                 <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">TXN ID</p>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate" title={tx.transactionId}>{tx.transactionId}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-3">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">SMS যাচাই:</p>
                    <VerificationStatusBadge tx={tx} />
                    {(tx.status === 'Pending' || tx.status === 'Verifying') && (tx.verificationStatus === 'Mismatch' || tx.verificationStatus === 'Not Found') && (
                        <button onClick={() => onReverify(tx)} disabled={!!reverifyingId} className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50" title="পুনরায় যাচাই করুন">
                            <ArrowPathIcon className={`h-4 w-4 ${reverifyingId === tx.requestId ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
                {(tx.status === 'Pending' || tx.status === 'Verifying') && (
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => onApprove(tx)} 
                            disabled={!!processingId || tx.verificationStatus === 'Duplicate'}
                            className={`!w-auto !py-1.5 !px-3 !text-xs !bg-green-600 hover:!bg-green-700 ${tx.verificationStatus === 'Verified' ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-green-500' : ''}`}
                            title={tx.verificationStatus === 'Duplicate' ? 'এই লেনদেনটি ইতিমধ্যে ব্যবহৃত হয়েছে।' : 'অনুমোদন করুন'}
                        >Approve</Button>
                        <Button 
                            variant="danger" 
                            onClick={() => onReject(tx)} 
                            disabled={!!processingId} 
                            className="!w-auto !py-1.5 !px-3 !text-xs !bg-red-600 hover:!bg-red-700"
                        >Reject</Button>
                    </div>
                )}
            </div>
        </div>
    );
};


const RechargeRequests: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [moneyRequests, setMoneyRequests] = useState<AdminTransaction[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [reverifyingId, setReverifyingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filter, setFilter] = useState<RequestStatus>('Pending');
    type ConfirmationState = { action: 'approve' | 'reject'; tx: AdminTransaction } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);

    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    
    const loadData = useCallback(async (showLoading = true) => {
        if(showLoading) setIsLoading(true);
        try {
            const [usersResponse, moneyRequestsData] = await Promise.all([
                fetchAllUsers(1, 10000),
                fetchAllMoneyRequests()
            ]);
            setUsers(usersResponse.users);
            setMoneyRequests(moneyRequestsData);
        } catch (error) {
            addToast('প্রয়োজনীয় তথ্য লোড করা যায়নি।', 'error');
        } finally {
            if(showLoading) setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const filteredRequests = useMemo(() => {
        if (filter === 'Pending') {
            return moneyRequests.filter(req => req.status === 'Pending' || req.status === 'Verifying');
        }
        return moneyRequests.filter(req => req.status === filter);
    }, [moneyRequests, filter]);

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
        setRejectionReason('');
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
                await rejectTransaction(tx.requestId, rejectionReason);
                addToast('অনুরোধটি সফলভাবে বাতিল করা হয়েছে।', 'success');
            }
            setConfirmationState(null);
            loadData(false);
        } catch (error) {
            const err = error as Error;
            const actionText = action === 'approve' ? 'অনুমোদন' : 'বাতিল';
            addToast(`লেনদেন ${actionText} করা যায়নি: ${err.message}`, 'error');
        } finally {
             setConfirmationState(null);
            setProcessingId(null);
        }
    };

    const handleReverify = async (tx: AdminTransaction) => {
        setReverifyingId(tx.requestId);
        try {
            const result = await apiReverifyTransaction(tx.requestId);
            if (result.newStatus === 'Approved') {
                addToast('যাচাই সফল! লেনদেনটি অনুমোদিত হয়েছে।', 'success');
                loadData(false);
            } else {
                setMoneyRequests(prev => prev.map(req => 
                    req.requestId === tx.requestId 
                        ? { ...req, verificationStatus: result.verificationStatus as any, smsAmount: result.smsAmount, smsCompany: result.smsCompany, smsSenderNumber: result.smsSenderNumber } 
                        : req
                ));
    
                if (result.verificationStatus === 'Mismatch') {
                    addToast('তথ্যে অমিল পাওয়া গেছে।', 'error');
                } else if (result.verificationStatus === 'Not Found') {
                    addToast('SMS তালিকায় এই ট্রানজেকশন আইডি খুঁজে পাওয়া যায়নি।', 'error');
                } else if (result.verificationStatus === 'Duplicate') {
                     addToast('এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে।', 'error');
                } else {
                    addToast('পুনরায় যাচাই সম্পন্ন হয়েছে।', 'success');
                }
            }
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setReverifyingId(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">টাকা যোগের অনুরোধ</h1>
            
            <div className="flex flex-wrap gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-1 w-fit bg-slate-50 dark:bg-slate-800">
                {(['Pending', 'Approved', 'Rejected'] as RequestStatus[]).map(status => (
                    <button 
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === status ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        {status === 'Pending' ? 'পেন্ডিং ও যাচাই' : 
                            status === 'Approved' ? 'অনুমোদিত' : 
                            'বাতিল'}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    [...Array(5)].map((_, i) => <RequestCardSkeleton key={i} />)
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((tx) => (
                        <RequestCard
                            key={tx.requestId}
                            tx={tx}
                            user={users.find(u => u.id === tx.userId)}
                            onViewUser={handleViewUser}
                            onApprove={() => openConfirmationModal('approve', tx)}
                            onReject={() => openConfirmationModal('reject', tx)}
                            onReverify={handleReverify}
                            processingId={processingId}
                            reverifyingId={reverifyingId}
                        />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <p className="text-slate-500">এই বিভাগে কোনো অনুরোধ পাওয়া যায়নি।</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="ইউজারের বিবরণ">
                {selectedUser && ( <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300"> <p><strong>নাম:</strong> {selectedUser.name}</p> <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p> <p><strong>ইমেইল:</strong> {selectedUser.email}</p> <p><strong>আইপি:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p> </div> )}
            </Modal>
            
            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="অনুরোধ নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                         {confirmationState.tx.verificationStatus === 'Mismatch' && confirmationState.action === 'approve' && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
                                <p className="font-bold">সতর্কতা: তথ্যে অমিল রয়েছে!</p>
                                <p>ব্যবহারকারীর অনুরোধ: ৳{toBengaliNumber(confirmationState.tx.amount)}, নম্বর: ...{confirmationState.tx.senderNumber}</p>
                                <p>SMS অনুযায়ী: ৳{toBengaliNumber(confirmationState.tx.smsAmount || 0)}, নম্বর: ...{(confirmationState.tx.smsSenderNumber || '????').slice(-4)}</p>
                            </div>
                        )}
                         <p className="text-sm text-slate-600 dark:text-slate-300">আপনি কি <strong>{users.find(u => u.id === confirmationState.tx.userId)?.name}</strong> এর <strong>৳{toBengaliNumber(confirmationState.tx.amount)}</strong> টাকার অনুরোধটি <strong>{confirmationState.action === 'approve' ? 'অনুমোদন' : 'বাতিল'}</strong> করতে নিশ্চিত?</p>
                         {confirmationState.action === 'reject' && (
                             <div>
                                <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">বাতিলের কারণ (ঐচ্ছিক)</label>
                                <textarea id="rejectionReason" rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="কারণ উল্লেখ করুন..."/>
                            </div>
                         )}
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setConfirmationState(null)} className="w-1/2">ফিরে যান</Button>
                            <Button type="button" variant={confirmationState.action === 'approve' ? 'primary' : 'danger'} onClick={handleConfirmAction} isLoading={processingId === confirmationState.tx.requestId} className="w-1/2">{confirmationState.action === 'approve' ? 'অনুমোদন করুন' : 'বাতিল করুন'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RechargeRequests;
