import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { Operator } from '../../types';
import { createBiometricOrder } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { useSettings } from '../../context/SettingsContext';
import Spinner from '../common/Spinner';
import { ExclamationTriangleIcon, ClipboardDocumentCheckIcon, WifiIcon, ChevronUpDownIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import LoadingModal from '../common/LoadingModal';
import { toBengaliNumber } from '../../utils/formatters';

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

    if (!settings?.isBiometricOrderVisible) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                 <div className="flex items-center space-x-3">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-500"/>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">বায়োমেট্রিক অর্ডার</h1>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl shadow-lg text-center space-y-3">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                        {settings?.biometricOrderOffMessage || "অর্ডার সুবিধা বন্ধ আছে"}
                    </h2>
                    <p className="text-[13px] text-yellow-600 dark:text-yellow-400">
                        অর্ডার করার সুবিধা সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
             <div className="flex items-center space-x-3">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-500"/>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">বায়োমেট্রিক অর্ডার</h1>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="text-center bg-teal-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 border border-teal-200 dark:border-teal-800">
                     <p className="text-sm text-slate-500 dark:text-slate-400">অর্ডার মূল্য</p>
                    <p className="font-bold text-3xl text-teal-600 dark:text-teal-300">
                        {isSettingsLoading ? 
                            <span className="animate-pulse">লোড হচ্ছে...</span> : 
                            `৳${toBengaliNumber(settings?.biometricOrderPrice ?? 0)}`
                        }
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">আপনার ওয়ালেট থেকে এই পরিমাণ টাকা কেটে নেওয়া হবে।</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="operator" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            অপারেটর
                        </label>
                        <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <WifiIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <select
                                id="operator"
                                value={operator}
                                onChange={(e) => setOperator(e.target.value as Operator)}
                                className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 appearance-none"
                            >
                                {Object.values(Operator).map((op) => (
                                    <option key={op} value={op}>{op}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                                <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="mobile" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            মোবাইল নাম্বার
                        </label>
                        <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                id="mobile"
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="e.g., 01712345678"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button type="submit" isLoading={isLoading}>
                            অর্ডার কনফার্ম করুন
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BiometricOrder;