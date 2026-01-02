
import React, { useState, useEffect, useCallback } from 'react';
import { Settings as AppSettings, PaymentMethod } from '../../types';
import { apiFetchSettings, apiUpdateSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
    const [price, setPrice] = useState(0);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [notificationEmail, setNotificationEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const [newMethod, setNewMethod] = useState({ name: '', type: 'Bkash' as 'Bkash' | 'Nagad' | 'Rocket', number: '', logoUrl: '' });

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiFetchSettings();
            setPrice(data.biometricOrderPrice);
            setMethods(data.paymentMethods || []);
            setNotificationEmail(data.notificationEmail || '');
        } catch (error) {
            addToast('সেটিংস লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(Number(e.target.value));
    };

    const handleNewMethodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewMethod(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMethod = () => {
        if (!newMethod.name.trim() || !newMethod.number.trim()) {
            addToast('অনুগ্রহ করে পদ্ধতির নাম এবং নম্বর দিন।', 'error');
            return;
        }
        setMethods(prev => [...prev, newMethod]);
        setNewMethod({ name: '', type: 'Bkash', number: '', logoUrl: '' }); // Reset form
    };

    const handleDeleteMethod = (indexToDelete: number) => {
        setMethods(prev => prev.filter((_, index) => index !== indexToDelete));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const settingsToSave: AppSettings = {
            biometricOrderPrice: price,
            paymentMethods: methods,
            notificationEmail: notificationEmail
        };

        setIsSaving(true);
        try {
            await apiUpdateSettings(settingsToSave);
            addToast('সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'সেটিংস সংরক্ষণ করা যায়নি।', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">অ্যাপ সেটিংস</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 border-b pb-3 mb-6 dark:border-slate-600">সাধারণ সেটিংস</h2>
                     <div className="space-y-4">
                        <Input
                            id="biometricOrderPrice"
                            name="biometricOrderPrice"
                            label="বায়োমেট্রিক অর্ডার মূল্য (৳)"
                            type="number"
                            value={price}
                            onChange={handlePriceChange}
                            required
                        />
                        <Input
                            id="notificationEmail"
                            name="notificationEmail"
                            label="নোটিফিকেশন ইমেইল"
                            type="email"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            placeholder="admin@example.com"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 border-b pb-3 dark:border-slate-600">পেমেন্ট পদ্ধতি</h2>
                    
                    {methods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center space-x-4">
                                {method.logoUrl && <img src={method.logoUrl} alt={method.name} className="h-10 w-10 rounded-md object-contain bg-white p-1 shadow" />}
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{method.name} ({method.type})</p>
                                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{method.number}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => handleDeleteMethod(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                     {methods.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">কোনো পেমেন্ট পদ্ধতি যোগ করা হয়নি।</p>}

                    <div className="border-t pt-6 dark:border-slate-600 space-y-4">
                         <h3 className="font-semibold text-slate-700 dark:text-slate-300">নতুন পদ্ধতি যোগ করুন</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id="new-name" name="name" label="পদ্ধতির নাম (যেমন: Bkash Personal)" value={newMethod.name} onChange={handleNewMethodChange} />
                            <Input id="new-number" name="number" label="একাউন্ট নম্বর" type="tel" value={newMethod.number} onChange={handleNewMethodChange} />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ধরন
                                </label>
                                <select
                                    id="new-type"
                                    name="type"
                                    value={newMethod.type}
                                    onChange={handleNewMethodChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option>Bkash</option>
                                    <option>Nagad</option>
                                    <option>Rocket</option>
                                </select>
                            </div>
                             <Input id="new-logoUrl" name="logoUrl" label="লোগো URL (ঐচ্ছিক)" value={newMethod.logoUrl} onChange={handleNewMethodChange} placeholder="https://.../logo.png" />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddMethod}>
                            <PlusIcon className="h-5 w-5 mr-2" /> যোগ করুন
                        </Button>
                    </div>
                </div>

                <div>
                    <Button type="submit" isLoading={isSaving}>
                        সকল পরিবর্তন সংরক্ষণ করুন
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Settings;