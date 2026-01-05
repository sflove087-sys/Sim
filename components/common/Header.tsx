import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, Bars3Icon, BellIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import ThemeSwitcher from './ThemeSwitcher';
import { Page, Notification } from '../../types';
import { apiFetchNotifications, apiMarkNotificationsRead } from '../../services/api';
import Notifications from './Notifications';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
    onMenuClick: () => void;
    setActivePage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, setActivePage }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await apiFetchNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const handleToggleNotifications = async () => {
        setIsNotificationOpen(prev => !prev);
        if (!isNotificationOpen && unreadCount > 0) {
            // Mark unread notifications as read
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            try {
                await apiMarkNotificationsRead(unreadIds);
                // Optimistically update UI
                setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        }
    };
    
    return (
        <header className="relative flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg flex-shrink-0 z-20">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="md:hidden mr-2 text-white p-2 -ml-2">
                    <Bars3Icon className="h-6 w-6" />
                </button>
                 <div className="flex items-center space-x-2 md:hidden">
                    <CircleStackIcon className="h-7 w-7 text-white" />
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        ডিজিটাল সেবা
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
                <LanguageSwitcher />
                <ThemeSwitcher />
                <div className="relative">
                    <button
                        onClick={handleToggleNotifications}
                        className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
                        title="নোটিফিকেশন"
                    >
                        <BellIcon className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                        )}
                    </button>
                     {isNotificationOpen && (
                        <Notifications 
                            notifications={notifications} 
                            onClose={() => setIsNotificationOpen(false)} 
                            onRefresh={fetchNotifications}
                        />
                    )}
                </div>
                <button
                    onClick={() => setActivePage(Page.PROFILE)}
                    className="flex items-center space-x-2 p-1 -m-1 rounded-lg hover:bg-white/20 transition-colors"
                    title="প্রোফাইল দেখুন"
                >
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover border-2 border-white/50" />
                    ) : (
                        <UserCircleIcon className="h-9 w-9 text-indigo-200"/>
                    )}
                    <span className="font-semibold text-base text-white hidden sm:block">{user?.name}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;