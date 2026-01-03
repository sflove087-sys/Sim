import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from '../../types';
import { 
    fetchAllUsers, 
    apiAdminRecharge, 
    apiFetchAdminRecharges,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { toBengaliNumber } from '../../utils/formatters';
import LoadingModal from '../common/LoadingModal';

const AdminRecharge: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [rechargeHistory, setRechargeHistory] = useState<Transaction[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'অজানা ব্যবহারকারী';

    const loadInitialData = useCallback(async (showLoading = true) => {
        if(showLoading) setIsLoading(true);
        try {
            const [usersResponse, historyData] = await Promise.all([
                fetchAllUsers(1, 10000), // Fetch a large number of users for the dropdown
                apiFetchAdminRecharges(),
            ]);
            setUsers(usersResponse.users);
            setRechargeHistory(historyData);
        } catch (error) {
            addToast('প্রয়োজনীয় তথ্য লোড করা যায়নি।', 'error');
        } finally {
            if(showLoading) setIsLoading(false);
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
            loadInitialData(false); // Reload data without full page loader
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <LoadingModal isOpen={isSubmitting} />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">সরাসরি রিচার্জ</h1>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">ব্যবহারকারীকে রিচার্জ করুন</h2>
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
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300 px-2">রিচার্জের ইতিহাস</h2>
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
        </div>
    );
};

export default AdminRecharge;