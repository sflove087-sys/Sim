import React, { useState, useEffect, useMemo } from 'react';
import WalletCard from './WalletCard';
import { Page } from '../../types';
import { PlusCircleIcon, ClipboardDocumentListIcon, Squares2X2Icon, InformationCircleIcon, PhoneArrowUpRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import RecentTransactions from './RecentTransactions';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const { user } = useAuth();
    const { settings, isLoading: isSettingsLoading } = useSettings();
    const [activeNotices, setActiveNotices] = useState<string[]>([]);
   
    useEffect(() => {
        if (settings?.headlineNotices) {
            const dismissedNoticesRaw = localStorage.getItem('dismissedNotices');
            const dismissedNotices = dismissedNoticesRaw ? JSON.parse(dismissedNoticesRaw) : [];
            const newActiveNotices = settings.headlineNotices.filter(n => !dismissedNotices.includes(n));
            setActiveNotices(newActiveNotices);
        } else {
            setActiveNotices([]);
        }
    }, [settings?.headlineNotices]);

    const handleDismissNotice = (noticeToDismiss: string) => {
        const dismissedNoticesRaw = localStorage.getItem('dismissedNotices');
        const dismissedNotices = dismissedNoticesRaw ? JSON.parse(dismissedNoticesRaw) : [];
        const newDismissedNotices = [...dismissedNotices, noticeToDismiss];
        localStorage.setItem('dismissedNotices', JSON.stringify(newDismissedNotices));
        setActiveNotices(prev => prev.filter(n => n !== noticeToDismiss));
    };
    
    // Animation duration depends on the number of notices to maintain a consistent speed
    const animationDuration = useMemo(() => activeNotices.length > 1 ? activeNotices.length * 4 : 0, [activeNotices]);
    const noticesToDisplay = useMemo(() => activeNotices.length > 1 ? [...activeNotices, ...activeNotices] : activeNotices, [activeNotices]);


    const allMenuItems = useMemo(() => [
        { page: Page.ADD_MONEY, label: 'টাকা যোগ করুন', icon: PlusCircleIcon, color: 'bg-green-500', visible: settings?.isAddMoneyVisible },
        { page: Page.BIOMETRIC_ORDER, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentListIcon, color: 'bg-indigo-500', visible: settings?.isBiometricOrderVisible },
        { page: Page.CALL_LIST_ORDER, label: 'কল লিস্ট অর্ডার', icon: PhoneArrowUpRightIcon, color: 'bg-sky-500', visible: settings?.isCallListOrderVisible },
        { page: Page.ORDER_HISTORY, label: 'অর্ডার হিস্টোরি', icon: Squares2X2Icon, color: 'bg-amber-500', visible: true },
    ], [settings]);

    const visibleMenuItems = allMenuItems.filter(item => item.visible);

    return (
        <div className="space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 text-center">
                স্বাগতম, <span className="text-indigo-600">{user?.name}</span>
            </h1>
            <WalletCard />

            { !isSettingsLoading && activeNotices.length > 0 && (
                <>
                {activeNotices.length > 1 && (
                    <style>
                    {`
                        @keyframes scroll-vertical {
                            from { transform: translateY(0%); }
                            to { transform: translateY(-50%); }
                        }
                        .animate-scroll-vertical {
                            animation: scroll-vertical ${animationDuration}s linear infinite;
                        }
                        .group:hover .animate-scroll-vertical {
                            animation-play-state: paused;
                        }
                    `}
                    </style>
                )}
                <div className="bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-xl shadow-md border-l-4 border-indigo-500 overflow-hidden group">
                    <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-base text-indigo-800 dark:text-indigo-200">নোটিশ</h4>
                           <div className="relative h-6 mt-1 overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full ${activeNotices.length > 1 ? 'animate-scroll-vertical' : ''}`}>
                                    {noticesToDisplay.map((notice, index) => (
                                        <p key={index} className="text-[13px] text-indigo-700 dark:text-indigo-300 font-medium h-6 leading-6 truncate">
                                            {notice}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDismissNotice(activeNotices[0])} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0" title="নোটিশ বন্ধ করুন">
                            <XMarkIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                        </button>
                    </div>
                </div>
                </>
            )}
            
            {visibleMenuItems.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {visibleMenuItems.map(item => (
                        <button
                            key={item.page}
                            onClick={() => setActivePage(item.page)}
                            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200 dark:border-slate-700"
                        >
                            <div className={`p-3 rounded-full ${item.color} text-white mb-2 shadow-lg`}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <span className="font-semibold text-base text-center text-slate-700 dark:text-slate-300">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
            <RecentTransactions setActivePage={setActivePage} />
        </div>
    );
};

export default Dashboard;