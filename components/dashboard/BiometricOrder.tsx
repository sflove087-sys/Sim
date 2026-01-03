import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { Operator } from '../../types';
import { createBiometricOrder } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { useSettings } from '../../context/SettingsContext';
import Spinner from '../common/Spinner';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import LoadingModal from '../common/LoadingModal';

const BiometricOrder: React.FC = () => {
    const [operator, setOperator] = useState<Operator>(Operator.GP);
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const { refreshWallet } = useWallet();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operator || !mobile) {
            addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await createBiometricOrder({ operator, mobile });
            addToast(response.message, 'success');
            refreshWallet();
            setMobile('');
        } catch (error)
 {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSettingsLoading) {
        return <div className="text-center p-10"><Spinner size="lg" /></div>;
    }

    if (!settings?.isOrderingEnabled) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">বায়োমেট্রিক অর্ডার</h1>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl shadow-lg text-center space-y-3">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                        {settings?.headlineNotice || "অর্ডার সুবিধা বন্ধ আছে"}
                    </h2>
                    <p className="text-yellow-600 dark:text-yellow-400">
                        অর্ডার করার সুবিধা সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">বায়োমেট্রিক অর্ডার</h1>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="text-center bg-indigo-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-300">
                        অর্ডার মূল্য: {isSettingsLoading ? 
                            <span className="animate-pulse">লোড হচ্ছে...</span> : 
                            `৳${settings?.biometricOrderPrice}`
                        }
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">আপনার ওয়ালেট থেকে এই পরিমাণ টাকা কেটে নেওয়া হবে।</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="operator" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            অপারেটর
                        </label>
                        <select
                            id="operator"
                            value={operator}
                            onChange={(e) => setOperator(e.target.value as Operator)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                            {Object.values(Operator).map((op) => (
                                <option key={op} value={op}>{op}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        id="mobile"
                        label="মোবাইল নাম্বার"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g., 01712345678"
                        required
                    />
                    <Button type="submit" isLoading={isLoading}>
                        অর্ডার কনফার্ম করুন
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default BiometricOrder;