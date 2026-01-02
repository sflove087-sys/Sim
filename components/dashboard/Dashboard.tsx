
import React from 'react';
import WalletCard from './WalletCard';
import { Page } from '../../types';
import { PlusCircleIcon, ClipboardDocumentListIcon, Squares2X2Icon, CreditCardIcon } from '@heroicons/react/24/solid';
import RecentTransactions from './RecentTransactions';

interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const menuItems = [
        { page: Page.ADD_MONEY, label: 'টাকা যোগ করুন', icon: PlusCircleIcon, color: 'bg-green-500' },
        { page: Page.BIOMETRIC_ORDER, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentListIcon, color: 'bg-blue-500' },
        { page: Page.ORDER_HISTORY, label: 'অর্ডার হিস্টোরি', icon: Squares2X2Icon, color: 'bg-yellow-500' },
        { page: Page.TRANSACTION_HISTORY, label: 'লেনদেন হিস্টোরি', icon: CreditCardIcon, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6">
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
