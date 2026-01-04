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
import { EyeIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ShieldExclamationIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
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
    const { verificationStatus, smsAmount, smsCompany, smsSenderNumber } = tx;
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

const RechargeRequests: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [moneyRequests, setMoneyRequests] = useState<AdminTransaction[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [reverifyingId, setReverifyingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isTxDetailsModalOpen, setIsTxDetailsModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filter, setFilter] = useState<RequestStatus>('Pending');
    type ConfirmationState = { action: 'approve' | 'reject'; tx: AdminTransaction } | null;
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null);

    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'অজানা ব্যবহারকারী';

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

    const handleViewTxDetails = (tx: AdminTransaction) => {
        setSelectedTx(tx);
        setIsTxDetailsModalOpen(true);
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
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <div className="px-2 pb-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">ব্যবহারকারীর অনুরোধসমূহ</h2>
                     <div className="flex flex-wrap gap-2 mt-3 border border-slate-200 dark:border-slate-600 rounded-lg p-1 w-fit">
                        {(['Pending', 'Approved', 'Rejected'] as RequestStatus[]).map(status => (
                            <button 
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${filter === status ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {status === 'Pending' ? 'পেন্ডিং ও যাচাই' : 
                                 status === 'Approved' ? 'অনুমোদিত' : 
                                 'বাতিল'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (<div className="flex justify-center p-10"><Spinner size="lg" /></div>) : 
                    filteredRequests.length > 0 ? (
                        <table className="responsive-table w-full min-w-[900px] text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">তারিখ</th>
                                    <th scope="col" className="px-6 py-3">ব্যবহারকারী</th>
                                    <th scope="col" className="px-6 py-3">পরিমাণ</th>
                                    <th scope="col" className="px-6 py-3">পদ্ধতি</th>
                                    <th scope="col" className="px-6 py-3">প্রেরক নম্বর</th>
                                    <th scope="col" className="px-6 py-3">TXN ID</th>
                                    <th scope="col" className="px-6 py-3">SMS যাচাই</th>
                                    <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                                    <th scope="col" className="px-6 py-3 text-center">একশন</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((tx) => (
                                    <tr key={tx.requestId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td data-label="তারিখ" className="px-6 py-4">{tx.date}</td>
                                        <td data-label="ব্যবহারকারী" className="px-6 py-4">
                                            <button onClick={() => handleViewUser(tx.userId)} className="text-left focus:outline-none group">
                                                <p className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">{getUserName(tx.userId)}</p>
                                                <span className="block text-xs text-slate-400 font-mono">{tx.userId}</span>
                                            </button>
                                        </td>
                                        <td data-label="পরিমাণ" className="px-6 py-4 text-base font-semibold">৳{toBengaliNumber(tx.amount)}</td>
                                        <td data-label="পদ্ধতি" className="px-6 py-4">{tx.paymentMethod}</td>
                                        <td data-label="প্রেরক নম্বর" className="px-6 py-4 font-mono">{tx.senderNumber}</td>
                                        <td data-label="TXN ID" className="px-6 py-4 font-mono">{tx.transactionId}</td>
                                        <td data-label="SMS যাচাই" className="px-6 py-4"><VerificationStatusBadge tx={tx} /></td>
                                        <td data-label="স্ট্যাটাস" className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                                        <td data-label="একশন" className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleViewTxDetails(tx)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="বিস্তারিত দেখুন">
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                
                                                {(tx.status === 'Pending' || tx.status === 'Verifying') && (tx.verificationStatus === 'Mismatch' || tx.verificationStatus === 'Not Found') && (
                                                    <button 
                                                        onClick={() => handleReverify(tx)} 
                                                        disabled={!!reverifyingId}
                                                        className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-wait" 
                                                        title="পুনরায় যাচাই করুন"
                                                    >
                                                        <ArrowPathIcon className={`h-5 w-5 ${reverifyingId === tx.requestId ? 'animate-spin' : ''}`} />
                                                    </button>
                                                )}

                                                {(tx.status === 'Pending' || tx.status === 'Verifying') && (
                                                    <>
                                                        <button onClick={() => openConfirmationModal('approve', tx)} disabled={!!processingId || tx.verificationStatus === 'Duplicate'} className={`font-medium text-green-600 dark:text-green-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline text-xs ${tx.verificationStatus === 'Verified' ? 'font-bold' : ''}`} title={tx.verificationStatus === 'Duplicate' ? 'এই লেনদেনটি ইতিমধ্যে ব্যবহৃত হয়েছে।' : 'অনুমোদন করুন'}>Approve</button>
                                                        <button onClick={() => openConfirmationModal('reject', tx)} disabled={!!processingId} className="font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 text-xs">Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p className="text-center p-6 text-slate-500">এই বিভাগে কোনো অনুরোধ পাওয়া যায়নি।</p> )}
                </div>
            </div>

            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="ইউজারের বিবরণ">
                {selectedUser && ( <div className="space-y-3 text-[13px] text-slate-600 dark:text-slate-300"> <p><strong>নাম:</strong> {selectedUser.name}</p> <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p> <p><strong>ইমেইল:</strong> {selectedUser.email}</p> <p><strong>আইপি:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p> </div> )}
            </Modal>
            
            <Modal isOpen={isTxDetailsModalOpen} onClose={() => setIsTxDetailsModalOpen(false)} title="লেনদেনের বিবরণ">
                {selectedTx && (
                    <div className="space-y-4 text-[13px]">
                        <VerificationProgressBar status={selectedTx.status} verificationStatus={selectedTx.verificationStatus || null} />
                        <hr className="dark:border-slate-600"/>
                        <div>
                            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">ব্যবহারকারীর তথ্য</h4>
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                                <p><strong>নাম:</strong> {getUserName(selectedTx.userId)}</p>
                                <p><strong>ইউজার আইডি:</strong> <span className="font-mono">{selectedTx.userId}</span></p>
                            </div>
                        </div>
                        <hr className="dark:border-slate-600"/>
                        <div>
                            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">লেনদেনের তথ্য</h4>
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                                <p><strong>পরিমাণ:</strong> ৳{toBengaliNumber(selectedTx.amount)}</p>
                                <p><strong>পদ্ধতি:</strong> {selectedTx.paymentMethod}</p>
                                <p><strong>প্রেরক নম্বর (শেষ ৪ ডিজিট):</strong> <span className="font-mono">{selectedTx.senderNumber}</span></p>
                                <p><strong>Txn ID:</strong> <span className="font-mono">{selectedTx.transactionId}</span></p>
                                <p><strong>তারিখ:</strong> {selectedTx.date}</p>
                                <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedTx.status} /></p>
                            </div>
                        </div>
                        <hr className="dark:border-slate-600"/>
                        <div>
                            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">যাচাইকরণের বিবরণ</h4>
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                                <p><strong>SMS যাচাই:</strong> <VerificationStatusBadge tx={selectedTx} /></p>
                                {selectedTx.verificationStatus === 'Mismatch' && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mt-2 space-y-1">
                                        <p><strong>SMS-এ টাকার পরিমাণ:</strong> ৳{toBengaliNumber(selectedTx.smsAmount || 0)}</p>
                                        <p><strong>SMS-এ পেমেন্ট কোম্পানি:</strong> {selectedTx.smsCompany || 'N/A'}</p>
                                        <p><strong>SMS-এ প্রেরক নম্বর:</strong> {selectedTx.smsSenderNumber || 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedTx.rejectionReason && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                <p className="font-semibold text-red-700 dark:text-red-300">বাতিলের কারণ:</p>
                                <p className="text-red-600 dark:text-red-400">{selectedTx.rejectionReason}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} title="অনুরোধ নিশ্চিত করুন">
                {confirmationState && (
                    <div className="space-y-4">
                         {confirmationState.tx.verificationStatus === 'Mismatch' && confirmationState.action === 'approve' && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300 text-[13px]">
                                <p className="font-bold">সতর্কতা: তথ্যে অমিল রয়েছে!</p>
                                <p>ব্যবহারকারীর অনুরোধ: ৳{toBengaliNumber(confirmationState.tx.amount)}, নম্বর: ...{confirmationState.tx.senderNumber}</p>
                                <p>SMS অনুযায়ী: ৳{toBengaliNumber(confirmationState.tx.smsAmount || 0)}, নম্বর: ...{(confirmationState.tx.smsSenderNumber || '????').slice(-4)}</p>
                            </div>
                        )}
                         <p className="text-[13px] text-slate-600 dark:text-slate-300">আপনি কি <strong>{getUserName(confirmationState.tx.userId)}</strong> এর <strong>৳{toBengaliNumber(confirmationState.tx.amount)}</strong> টাকার অনুরোধটি <strong>{confirmationState.action === 'approve' ? 'অনুমোদন' : 'বাতিল'}</strong> করতে নিশ্চিত?</p>
                         {confirmationState.action === 'reject' && (
                             <div>
                                <label htmlFor="rejectionReason" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2">বাতিলের কারণ (ঐচ্ছিক)</label>
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