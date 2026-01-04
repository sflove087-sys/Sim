import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { Operator } from '../../types';
import { createCallListOrder } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { toBengaliNumber } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import Spinner from '../common/Spinner';
import { ExclamationTriangleIcon, PhoneArrowUpRightIcon, CalendarDaysIcon, WifiIcon, ChevronUpDownIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import LoadingModal from '../common/LoadingModal';

type Duration = '3 Months' | '6 Months';

const CallListOrder: React.FC = () => {
    const [operator, setOperator] = useState<Operator>(Operator.GP);
    const [mobile, setMobile] = useState('');
    const [duration, setDuration] = useState<Duration>('3 Months');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const { wallet, refreshWallet } = useWallet();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    const prices = useMemo(() => ({
        '3 Months': settings?.callListPrice3Months || 900,
        '6 Months': settings?.callListPrice6Months || 1500,
    }), [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = prices[duration];

        if (!operator || !mobile || !duration) {
            addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'error');
            return;
        }

        if (wallet && wallet.balance < price) {
            addToast('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await createCallListOrder({ operator, mobile, duration });
            addToast(response.message, 'success');
            refreshWallet();
            setMobile('');
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSettingsLoading) {
        return <div className="text-center p-10"><Spinner size="lg" /></div>;
    }

    if (!settings?.isCallListOrderVisible) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <PhoneArrowUpRightIcon className="h-8 w-8 text-indigo-500"/>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">কল লিস্ট অর্ডার</h1>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl shadow-lg text-center space-y-3">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                        {settings?.callListOrderOffMessage || "অর্ডার সুবিধা বন্ধ আছে"}
                    </h2>
                    <p className="text-[13px] text-yellow-600 dark:text-yellow-400">
                        কল লিস্ট অর্ডার করার সুবিধা সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
            <div className="flex items-center space-x-3">
                <PhoneArrowUpRightIcon className="h-8 w-8 text-indigo-500"/>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">কল লিস্ট অর্ডার</h1>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                            মেয়াদ নির্বাচন করুন
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {(Object.keys(prices) as Duration[]).map((d) => (
                                <div key={d}>
                                    <input
                                        type="radio"
                                        id={`duration-${d}`}
                                        name="duration"
                                        value={d}
                                        checked={duration === d}
                                        onChange={() => setDuration(d)}
                                        className="hidden peer"
                                    />
                                    <label
                                        htmlFor={`duration-${d}`}
                                        className="flex flex-col items-center justify-center text-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 border-slate-200 dark:border-slate-700 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-500/50 peer-checked:bg-indigo-50 dark:peer-checked:bg-slate-700/50"
                                    >
                                        <CalendarDaysIcon className="h-8 w-8 mb-2 text-slate-400 peer-checked:text-indigo-500 transition-colors" />
                                        <p className="font-semibold text-[15px] text-slate-800 dark:text-slate-200">{d === '3 Months' ? '৩ মাস' : '৬ মাস'}</p>
                                        <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">৳{toBengaliNumber(prices[d])}</p>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
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
                                className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 appearance-none"
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
                                className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" isLoading={isLoading}>
                            অর্ডার কনফার্ম করুন (মূল্য: ৳{toBengaliNumber(prices[duration])})
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CallListOrder;