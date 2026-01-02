
import React, { useState, useEffect } from 'react';
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
import Settings from '../admin/Settings';
import AdminRecharge from '../admin/AdminRecharge';
import { useAuth } from '../../context/AuthContext';
import { apiUpdateUserActivity } from '../../services/api';
import { 
    HomeIcon, CreditCardIcon, PlusCircleIcon, ClipboardDocumentListIcon, Squares2X2Icon, UserCircleIcon, Cog6ToothIcon, UsersIcon, ClipboardDocumentCheckIcon, ArrowLeftOnRectangleIcon, ArchiveBoxIcon, WrenchScrewdriverIcon, CurrencyBangladeshiIcon, PhoneArrowUpRightIcon, PhoneIcon
} from '@heroicons/react/24/outline';

// Fix: Add type for page configuration objects to ensure strong typing for icons.
type PageInfo = {
    component: React.ComponentType<any>;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const userPages: Record<string, PageInfo> = {
    [Page.DASHBOARD]: { component: Dashboard, label: 'ড্যাশবোর্ড', icon: HomeIcon },
    [Page.ADD_MONEY]: { component: AddMoney, label: 'টাকা যোগ করুন', icon: PlusCircleIcon },
    [Page.BIOMETRIC_ORDER]: { component: BiometricOrder, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentListIcon },
    [Page.CALL_LIST_ORDER]: { component: CallListOrder, label: 'কল লিস্ট অর্ডার', icon: PhoneArrowUpRightIcon },
    [Page.ORDER_HISTORY]: { component: OrderHistory, label: 'অর্ডার হিস্টোরি', icon: Squares2X2Icon },
    [Page.TRANSACTION_HISTORY]: { component: TransactionHistory, label: 'লেনদেন হিস্টোরি', icon: CreditCardIcon },
    [Page.PROFILE]: { component: Profile, label: 'প্রোফাইল', icon: UserCircleIcon },
};

const adminPages: Record<string, PageInfo> = {
    [Page.ADMIN_DASHBOARD]: { component: AdminDashboard, label: 'অ্যাডমিন ড্যাশবোর্ড', icon: Cog6ToothIcon },
    [Page.USER_MANAGEMENT]: { component: UserManagement, label: 'ইউজার ম্যানেজমেন্ট', icon: UsersIcon },
    [Page.ADMIN_RECHARGE]: { component: AdminRecharge, label: 'টাকা যোগ ও রিচার্জ', icon: CurrencyBangladeshiIcon },
    [Page.MANAGE_ORDERS]: { component: ManageOrders, label: 'বায়োমেট্রিক অর্ডার', icon: ClipboardDocumentCheckIcon },
    [Page.MANAGE_CALL_LIST_ORDERS]: { component: ManageCallListOrders, label: 'কল লিস্ট অর্ডার', icon: PhoneIcon },
    [Page.ALL_TRANSACTIONS]: { component: AllTransactions, label: 'সকল লেনদেন', icon: ArchiveBoxIcon },
    [Page.ADMIN_SETTINGS]: { component: Settings, label: 'সেটিংস', icon: WrenchScrewdriverIcon },
};

export default function Layout() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'Admin';
    
    const initialPage = isAdmin ? Page.ADMIN_DASHBOARD : Page.DASHBOARD;
    const [activePage, setActivePage] = useState<Page>(initialPage);

    useEffect(() => {
        // This effect runs only for logged-in users because Layout is only rendered for them.
        // It's also safe for admins, as they are also users.
        const updateUserActivity = () => {
            // We don't need to handle errors here, it's a background task.
            // If it fails, the next attempt will fix it.
            apiUpdateUserActivity().catch(err => console.debug("Activity update failed:", err));
        };

        // Call it once immediately on layout mount
        updateUserActivity();

        // Then set an interval to call it periodically
        const intervalId = setInterval(updateUserActivity, 60 * 1000); // every 60 seconds

        // Cleanup function to clear the interval when the component unmounts (e.g., on logout)
        return () => {
            clearInterval(intervalId);
        };
    }, []); // Empty dependency array means this runs only once on mount and cleans up on unmount.

    const pagesToShow = isAdmin ? adminPages : userPages;
    const navItems = isAdmin ? Object.entries(adminPages) : Object.entries(userPages);

    const PageComponent = pagesToShow[activePage]?.component;

    if (!PageComponent) {
        setActivePage(initialPage);
        return null; 
    }

    // Fix: Redefine NavLink as a proper React.FC to handle the 'key' prop correctly
    // and to ensure strong typing from props.
    type NavLinkProps = {
        page: Page;
        label: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        isMobile?: boolean;
    };

    const NavLink: React.FC<NavLinkProps> = ({ page, label, icon: Icon, isMobile = false }) => (
        <button
            onClick={() => setActivePage(page)}
            className={`flex ${isMobile ? 'flex-col items-center justify-center text-xs' : 'items-center space-x-3 text-sm'} w-full p-2 rounded-lg transition-all duration-200 ${
                activePage === page
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-slate-700'
            }`}
        >
            <Icon className={`h-6 w-6 ${isMobile ? 'mb-1' : ''}`} />
            <span className="truncate">{label}</span>
        </button>
    );
    
    // Fix: Strongly type mobile navigation items to prevent type inference issues.
    type MobileNavItem = { page: Page; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; };

    const mobileNavItemsForAdmin: MobileNavItem[] = [
        { page: Page.ADMIN_DASHBOARD, label: "ড্যাশবোর্ড", icon: Cog6ToothIcon },
        { page: Page.USER_MANAGEMENT, label: "ইউজার", icon: UsersIcon },
        { page: Page.ADMIN_RECHARGE, label: "টাকা যোগ", icon: CurrencyBangladeshiIcon },
        { page: Page.MANAGE_ORDERS, label: "বায়োমেট্রিক", icon: ClipboardDocumentCheckIcon },
        { page: Page.MANAGE_CALL_LIST_ORDERS, label: "কল লিস্ট", icon: PhoneIcon },
        { page: Page.ALL_TRANSACTIONS, label: "লেনদেন", icon: ArchiveBoxIcon },
    ];
    
    const mobileNavItemsForUser: MobileNavItem[] = [
       { page: Page.DASHBOARD, label: "হোম", icon: HomeIcon },
       { page: Page.ADD_MONEY, label: "টাকা যোগ", icon: PlusCircleIcon },
       { page: Page.BIOMETRIC_ORDER, label: "বায়োমেট্রিক", icon: ClipboardDocumentListIcon },
       { page: Page.CALL_LIST_ORDER, label: "কল লিস্ট", icon: PhoneArrowUpRightIcon },
       { page: Page.PROFILE, label: "প্রোফাইল", icon: UserCircleIcon },
    ];

    const mobileNavItems = isAdmin ? mobileNavItemsForAdmin : mobileNavItemsForUser;

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center h-16 border-b dark:border-slate-700">
                    <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                         {isAdmin ? 'অ্যাডমিন প্যানেল' : 'ডিজিটাল সার্ভিস'}
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(([pageKey, { label, icon }]) => (
                        <NavLink key={pageKey} page={pageKey as Page} label={label} icon={icon} />
                    ))}
                     <button
                        onClick={logout}
                        className="flex items-center space-x-3 text-sm w-full p-2 rounded-lg transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                        <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                        <span>লগআউট</span>
                    </button>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => { /* Mobile menu toggle logic here */ }} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
                    <PageComponent setActivePage={setActivePage} />
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className={`md:hidden grid grid-cols-${mobileNavItems.length} gap-1 p-2 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-t-lg`}>
                   {mobileNavItems.map(({ page, label, icon }) => (
                       <NavLink key={page} page={page} label={label} icon={icon} isMobile={true} />
                   ))}
                </nav>
            </div>
        </div>
    );
}
