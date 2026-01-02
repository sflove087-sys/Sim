
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-md">
            <div className="flex items-center">
                {/* Mobile Menu Button - can be implemented if needed */}
                {/* <button onClick={onMenuClick} className="md:hidden text-slate-600 dark:text-slate-300">
                    <MenuIcon className="h-6 w-6" />
                </button> */}
                 <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-200 md:hidden">
                    স্বাগতম
                </h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-8 w-8 text-indigo-500"/>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.name}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center justify-center h-10 w-10 rounded-full text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 transition-colors"
                    title="লগআউট"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;
