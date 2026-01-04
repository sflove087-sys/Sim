import React from 'react';
import { Notification } from '../../types';
import { BellAlertIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface NotificationsProps {
    notifications: Notification[];
    onClose: () => void;
    onRefresh: () => void;
}

const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " বছর আগে";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " মাস আগে";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " দিন আগে";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ঘন্টা আগে";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " মিনিট আগে";
    return "এইমাত্র";
};

const Notifications: React.FC<NotificationsProps> = ({ notifications, onClose, onRefresh }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 overflow-hidden animate-fade-in-down">
            <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base">নোটিফিকেশন</h3>
                <button onClick={onRefresh} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ArrowPathIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map((n) => (
                            <li key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.isRead ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                                <div className="flex items-start space-x-3">
                                    <div className={`mt-1 flex-shrink-0 h-2 w-2 rounded-full ${!n.isRead ? 'bg-teal-500' : 'bg-transparent'}`}></div>
                                    <div className="flex-1">
                                        <p className="text-[13px] leading-snug">{n.message}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(n.timestamp)}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-8 space-y-2">
                        <BellAlertIcon className="h-10 w-10 mx-auto text-slate-400" />
                        <h4 className="font-semibold">কোনো নোটিফিকেশন নেই</h4>
                        <p className="text-xs text-slate-500">আপনার জন্য নতুন কোনো বার্তা নেই।</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fade-in-down {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default Notifications;
