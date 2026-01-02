
import React from 'react';
import WalletCard from './WalletCard';
import { Page } from '../../types';
import { PlusCircleIcon, ClipboardDocumentListIcon, Squares2X2Icon, CreditCardIcon, InformationCircleIcon, PhoneArrowUpRightIcon } from '@heroicons/react/24/solid';
import RecentTransactions from './RecentTransactions';
import { useSettings } from '../../context/SettingsContext';

interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const { settings, isLoading: isSettingsLoading } = useSettings();

    const menuItems = [
        { page: Page.ADD_MONEY, label: 'টাকা যোগ করুন', icon: PlusCircleIcon, color: 'bg-green-500' },
        { page: Page.BIOMETRIC_ORDER, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentListIcon, color: 'bg-blue-500' },
        { page: Page.CALL_LIST_ORDER, label: 'কল লিস্ট অর্ডার', icon: PhoneArrowUpRightIcon, color: 'bg-teal-500' },
        { page: Page.ORDER_HISTORY, label: 'অর্ডার হিস্টোরি', icon: Squares2X2Icon, color: 'bg-yellow-500' },
    ];

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes marquee {
                    0%   { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    white-space: nowrap;
                    padding-left: 100%;
                    animation: marquee 20s linear infinite;
                }
            `}</style>
            { !isSettingsLoading && settings?.headlineNotice && (
                <div className="bg-indigo-100 dark:bg-indigo-900/50 flex items-center p-3 rounded-xl shadow border-l-4 border-indigo-500 overflow-hidden space-x-3">
                    <InformationCircleIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                    <span className="font-bold text-indigo-800 dark:text-indigo-200 flex-shrink-0">নোটিশ:</span>
                    <div className="flex-1 overflow-hidden">
                        <p className="animate-marquee text-indigo-700 dark:text-indigo-300 font-medium">
                            {settings.headlineNotice}
                        </p>
                    </div>
                </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">ড্যাশবোর্ড</h1>
            <WalletCard />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {menuItems.map(item => (
                    <button
                        key={item.page}
                        onClick={() => setActivePage(item.page)}
                        className="flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`p-4 rounded-full ${item.color} text-white mb-3`}>
                            <item.icon className="h-8 w-8" />
                        </div>
                        <span className="font-semibold text-center text-slate-700 dark:text-slate-300">{item.label}</span>
                    </button>
                ))}
            </div>
            <RecentTransactions setActivePage={setActivePage} />
        </div>
    );
};

export default Dashboard;
