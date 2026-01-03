import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftOnRectangleIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="md:hidden text-slate-500 dark:text-slate-400 mr-2">
                    <Bars3Icon className="h-6 w-6" />
                </button>
                 <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-200 md:hidden truncate">
                    {`স্বাগতম, ${user?.name}`}
                </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2">
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-8 w-8 text-slate-400 dark:text-slate-500"/>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.name}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center justify-center h-9 w-9 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="লগআউট"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;