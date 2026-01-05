import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllUsers, apiAdminSendPushNotification } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Spinner from '../common/Spinner';
import { MegaphoneIcon, UserIcon, UsersIcon } from '@heroicons/react/24/solid';

const PushNotifications: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { addToast } = useToast();

    // Form state
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [specificUserId, setSpecificUserId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    const loadUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const { users: data } = await fetchAllUsers(1, 10000); // Fetch all users
            setUsers(data);
        } catch (error) {
            addToast("ব্যবহারকারীদের তালিকা লোড করা যায়নি।", 'error');
        } finally {
            setIsLoadingUsers(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            addToast('অনুগ্রহ করে শিরোনাম এবং বার্তা উভয়ই পূরণ করুন।', 'error');
            return;
        }
        if (target === 'specific' && !specificUserId) {
            addToast('অনুগ্রহ করে একজন ব্যবহারকারী নির্বাচন করুন।', 'error');
            return;
        }

        setIsSending(true);
        try {
            const targetValue = target === 'all' ? 'all' : specificUserId;
            const response = await apiAdminSendPushNotification({ target: targetValue, title, body });
            addToast(response.message, 'success');
            // Reset form
            setTitle('');
            setBody('');
            setSpecificUserId('');
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <MegaphoneIcon className="h-8 w-8 text-indigo-500"/>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">পুশ নোটিফিকেশন পাঠান</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">প্রাপক</label>
                        <fieldset className="grid grid-cols-2 gap-4">
                            <div>
                                <input type="radio" id="targetAll" name="target" value="all" checked={target === 'all'} onChange={() => setTarget('all')} className="hidden peer"/>
                                <label htmlFor="targetAll" className="flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-colors border-slate-200 dark:border-slate-700 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-500/50">
                                    <UsersIcon className="h-6 w-6 mr-3 text-slate-400 peer-checked:text-indigo-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">সকল ব্যবহারকারী</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="targetSpecific" name="target" value="specific" checked={target === 'specific'} onChange={() => setTarget('specific')} className="hidden peer"/>
                                 <label htmlFor="targetSpecific" className="flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-colors border-slate-200 dark:border-slate-700 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-500/50">
                                    <UserIcon className="h-6 w-6 mr-3 text-slate-400 peer-checked:text-indigo-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">নির্দিষ্ট ব্যবহারকারী</span>
                                </label>
                            </div>
                        </fieldset>
                    </div>

                    {target === 'specific' && (
                        <div>
                            <label htmlFor="specificUserId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ব্যবহারকারী নির্বাচন করুন</label>
                            {isLoadingUsers ? <Spinner /> : (
                                <select
                                    id="specificUserId"
                                    value={specificUserId}
                                    onChange={(e) => setSpecificUserId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="" disabled>-- একজন ব্যবহারকারীকে বেছে নিন --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.mobile})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                    
                    <Input id="title" label="শিরোনাম" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="নোটিফিকেশনের শিরোনাম" required />

                    <div>
                        <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">বার্তা</label>
                        <textarea id="body" rows={4} value={body} onChange={e => setBody(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="নোটিফিকেশনের সম্পূর্ণ বার্তা লিখুন..." required></textarea>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" isLoading={isSending}>
                            নোটিফিকেশন পাঠান
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PushNotifications;
