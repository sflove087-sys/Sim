import React, { useState, useEffect, useMemo } from 'react';
import { Page } from '../../types';
import Dashboard from '../dashboard/Dashboard';
import Header from './Header';
import AddMoney from '../dashboard/AddMoney';
import BiometricOrder from '../dashboard/BiometricOrder';
import CallListOrder from '../dashboard/CallListOrder';
import OrderHistory from '../dashboard/OrderHistory';
import TransactionHistory from '../dashboard/TransactionHistory';
import Profile from '../dashboard/Profile';
import AdminDashboard from '../admin/AdminDashboard';
import UserManagement from '../admin/UserManagement';
import ManageOrders from '../admin/ManageOrders';
import ManageCallListOrders from '../admin/ManageCallListOrders';
import AllTransactions from '../admin/AllTransactions';
import Settings from '../auth/Settings';
import RechargeRequests from '../admin/RechargeRequests';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { apiUpdateUserActivity } from '../../services/api';
import { 
    HomeIcon, CreditCardIcon, PlusCircleIcon, ClipboardDocumentListIcon, Squares2X2Icon, UserCircleIcon, Cog6ToothIcon, UsersIcon, ClipboardDocumentCheckIcon, ArrowLeftOnRectangleIcon, ArchiveBoxIcon, WrenchScrewdriverIcon, CurrencyBangladeshiIcon, PhoneArrowUpRightIcon, PhoneIcon, BanknotesIcon, CircleStackIcon
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import WelcomePopup from './WelcomePopup';
import LiveChatWidget from './LiveChatWidget';

type PageInfo = {
    component: React.ComponentType<any>;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    id: Page;
};

const allUserPages: PageInfo[] = [
    { id: Page.DASHBOARD, component: Dashboard, label: 'ড্যাশবোর্ড', icon: HomeIcon },
    { id: Page.ADD_MONEY, component: AddMoney, label: 'টাকা যোগ করুন', icon: PlusCircleIcon },
    { id: Page.BIOMETRIC_ORDER, component: BiometricOrder, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentListIcon },
    { id: Page.CALL_LIST_ORDER, component: CallListOrder, label: 'কল লিস্ট অর্ডার', icon: PhoneArrowUpRightIcon },
    { id: Page.ORDER_HISTORY, component: OrderHistory, label: 'অর্ডার হিস্টোরি', icon: Squares2X2Icon },
    { id: Page.TRANSACTION_HISTORY, component: TransactionHistory, label: 'লেনদেন হিস্টোরি', icon: CreditCardIcon },
    { id: Page.PROFILE, component: Profile, label: 'প্রোফাইল', icon: UserCircleIcon },
];

const adminPages: Record<string, Omit<PageInfo, 'id'>> = {
    [Page.ADMIN_DASHBOARD]: { component: AdminDashboard, label: 'অ্যাডমিন ড্যাশবোর্ড', icon: Cog6ToothIcon },
    [Page.USER_MANAGEMENT]: { component: UserManagement, label: 'ইউজার ম্যানেজমেন্ট', icon: UsersIcon },
    [Page.RECHARGE_REQUESTS]: { component: RechargeRequests, label: 'টাকা যোগের অনুরোধ', icon: BanknotesIcon },
    [Page.MANAGE_ORDERS]: { component: ManageOrders, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentCheckIcon },
    [Page.MANAGE_CALL_LIST_ORDERS]: { component: ManageCallListOrders, label: 'কল লিস্ট অর্ডার', icon: PhoneIcon },
    [Page.ALL_TRANSACTIONS]: { component: AllTransactions, label: 'সকল লেনদেন', icon: ArchiveBoxIcon },
    [Page.ADMIN_SETTINGS]: { component: Settings, label: 'সেটিংস', icon: WrenchScrewdriverIcon },
};

export default function Layout() {
    const { user, logout } = useAuth();
    const { settings } = useSettings();
    const isAdmin = user?.role === 'Admin';
    
    const initialPage = isAdmin ? Page.ADMIN_DASHBOARD : Page.DASHBOARD;
    const [activePage, setActivePage] = useState<Page>(initialPage);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);

    useEffect(() => {
        const welcomeShown = localStorage.getItem('welcomeMessageShown');
        if (welcomeShown !== 'true') {
            setShowWelcomePopup(true);
            localStorage.setItem('welcomeMessageShown', 'true');
        }
    }, []);

    useEffect(() => {
        const updateUserActivity = () => {
            apiUpdateUserActivity().catch(err => console.debug("Activity update failed:", err));
        };
        updateUserActivity();
        const intervalId = setInterval(updateUserActivity, 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const visibleUserPages = useMemo(() => {
        if (!settings || isAdmin) return allUserPages;
        return allUserPages.filter(page => {
            if (page.id === Page.ADD_MONEY) return settings.isAddMoneyVisible;
            if (page.id === Page.BIOMETRIC_ORDER) return settings.isBiometricOrderVisible;
            if (page.id === Page.CALL_LIST_ORDER) return settings.isCallListOrderVisible;
            return true;
        });
    }, [settings, isAdmin]);

    const pagesToShow = useMemo(() => {
        if (isAdmin) {
            return Object.fromEntries(Object.entries(adminPages).map(([key, value]) => [key, { ...value, id: key as Page }]));
        }
        return Object.fromEntries(visibleUserPages.map(page => [page.id, page]));
    }, [isAdmin, visibleUserPages]);
    
    const navItems = useMemo(() => Object.values(pagesToShow), [pagesToShow]);

    const PageComponent = pagesToShow[activePage]?.component;

    if (!PageComponent) {
        if (activePage !== initialPage) {
            setActivePage(initialPage);
        }
        return null; 
    }

    type NavLinkProps = {
        page: Page;
        label: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    };

    const NavLink: React.FC<NavLinkProps> = ({ page, label, icon: Icon }) => (
        <button
            onClick={() => {
                setActivePage(page);
                setIsMobileMenuOpen(false);
            }}
            className={`flex items-center space-x-3 text-[15px] w-full p-3 rounded-lg transition-all duration-200 group ${
                activePage === page
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
            }`}
        >
            <Icon className={`h-6 w-6 transition-colors ${activePage === page ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
            <span className="truncate font-medium">{label}</span>
        </button>
    );
    
    const SidebarContent = () => (
        <>
            <div className="flex items-center justify-between h-16 px-4 border-b dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <CircleStackIcon className="h-7 w-7 text-indigo-600" />
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        {isAdmin ? 'অ্যাডমিন' : 'ডিজিটাল সেবা'}
                    </h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 -mr-2 text-slate-500 dark:text-slate-400">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {navItems.map(({ id, label, icon }) => (
                    <NavLink key={id} page={id} label={label} icon={icon} />
                ))}
            </nav>
            <div className="p-3 border-t dark:border-slate-700">
                 <button
                    onClick={logout}
                    className="flex items-center space-x-3 text-[15px] w-full p-3 rounded-lg transition-all duration-200 font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    <span>লগআউট</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            <LiveChatWidget />
            {showWelcomePopup && <WelcomePopup onClose={() => setShowWelcomePopup(false)} />}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300">
                <SidebarContent />
            </aside>
            
            <div 
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <aside className={`fixed top-0 left-0 h-full z-50 w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} setActivePage={setActivePage} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
                    <div className="animate-fade-in-up">
                        <PageComponent setActivePage={setActivePage} />
                    </div>
                </main>
            </div>
        </div>
    );
}