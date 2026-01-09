import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import Spinner from '../common/Spinner';
import { toBengaliNumber } from '../../utils/formatters';
import { EyeIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/solid';

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

const CustomerList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const { addToast } = useToast();

    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { users: data, total } = await fetchAllUsers(currentPage, PAGE_SIZE);
            setUsers(data);
            setTotalUsers(total);
        } catch (error) {
            addToast("গ্রাহকদের তালিকা লোড করা যায়নি।", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers, currentPage]);

    const handleView = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        addToast(`'${user.name}' এর তথ্য এডিট করার সুবিধা এখনো যুক্ত করা হয়নি।`, 'error');
    };

    const handleDelete = (user: User) => {
        addToast(`'${user.name}' কে মুছে ফেলার সুবিধা এখনো যুক্ত করা হয়নি।`, 'error');
    };
    
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div></div></td>
            <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
            <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
            <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
            <td className="px-5 py-4"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
            <td className="px-5 py-4"><div className="flex gap-2"><div className="h-8 w-8 rounded-md bg-slate-200 dark:bg-slate-700"></div><div className="h-8 w-8 rounded-md bg-slate-200 dark:bg-slate-700"></div><div className="h-8 w-8 rounded-md bg-slate-200 dark:bg-slate-700"></div></div></td>
        </tr>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">গ্রাহক তালিকা</h1>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 responsive-table">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-5 py-4">নাম</th>
                            <th scope="col" className="px-5 py-4">মোবাইল</th>
                            <th scope="col" className="px-5 py-4">পরিমাণ (ব্যালেন্স)</th>
                            <th scope="col" className="px-5 py-4">মেয়াদ শেষ</th>
                            <th scope="col" className="px-5 py-4">স্ট্যাটাস</th>
                            <th scope="col" className="px-5 py-4 text-right">একশন</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} />)
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                    <td data-label="নাম" className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover"/>
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                            )}
                                            <span>{user.name}</span>
                                        </div>
                                    </td>
                                    <td data-label="মোবাইল" className="px-5 py-4">{user.mobile}</td>
                                    <td data-label="পরিমাণ" className="px-5 py-4 font-semibold">৳{toBengaliNumber(user.balance?.toFixed(2) ?? '0.00')}</td>
                                    <td data-label="মেয়াদ শেষ" className="px-5 py-4">N/A</td>
                                    <td data-label="স্ট্যাটাস" className="px-5 py-4"><StatusBadge status={user.status} /></td>
                                    <td data-label="একশন" className="px-5 py-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleView(user)} className="p-2 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50" title="View"><EyeIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleEdit(user)} className="p-2 rounded-md text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/50" title="Edit"><PencilIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDelete(user)} className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                 { !isLoading && users.length === 0 && <p className="text-center p-6 text-slate-500">কোনো গ্রাহক পাওয়া যায়নি।</p> }
            </div>

            {!isLoading && totalUsers > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="গ্রাহকের বিবরণ">
                {selectedUser && (
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                         <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b dark:border-slate-700">
                            {selectedUser.photoUrl ? (
                                <img src={selectedUser.photoUrl} alt={selectedUser.name} className="h-20 w-20 rounded-full object-cover shadow-md"/>
                            ) : (
                                <UserCircleIcon className="h-20 w-20 text-slate-300 dark:text-slate-600"/>
                            )}
                            <div>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{selectedUser.name}</p>
                                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <p><strong>মোবাইল:</strong> {selectedUser.mobile}</p>
                        <p><strong>ব্যালেন্স:</strong> ৳{toBengaliNumber(selectedUser.balance?.toFixed(2) ?? '0.00')}</p>
                        <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedUser.status} /></p>
                        <p><strong>আইপি ঠিকানা:</strong> <span className="font-mono">{selectedUser.ipAddress || 'N/A'}</span></p>
                        <p><strong>সর্বশেষ সক্রিয়:</strong> {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString('bn-BD') : 'কখনো না'}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerList;
