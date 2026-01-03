import React, { useState, useEffect } from 'react';
import { UsersIcon, ClipboardDocumentListIcon, CheckCircleIcon, CurrencyBangladeshiIcon } from '@heroicons/react/24/solid';
import { fetchAdminDashboardAnalytics, apiFetchChartData } from '../../services/api';
import { toBengaliNumber } from '../../utils/formatters';
import { AdminDashboardAnalytics, AdminChartData } from '../../types';
import AnalyticsChart from './AnalyticsChart';

const StatCard = ({ icon: Icon, title, value, color, isLoading } : { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, title: string, value: string | number, color: string, isLoading: boolean }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">{title}</p>
            {isLoading ? 
                <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md mt-1"></div>
                :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardAnalytics | null>(null);
    const [chartData, setChartData] = useState<AdminChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch stats and chart data in parallel for faster loading
                const [statsData, chartData] = await Promise.all([
                    fetchAdminDashboardAnalytics(),
                    apiFetchChartData()
                ]);
                setStats(statsData);
                setChartData(chartData);
            } catch (error) {
                console.error('Failed to load admin dashboard data', error);
                setError('ড্যাশবোর্ডের তথ্য লোড করা যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।');
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    return (
        <div className="space-y-6 pb-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">অ্যাডমিন ড্যাশবোর্ড</h1>
            
            {error && (
                <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg" role="alert">
                    <p className="font-bold">একটি ত্রুটি ঘটেছে</p>
                    <p className="text-[13px]">{error}</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={UsersIcon} title="মোট ইউজার" value={toBengaliNumber(stats?.totalUsers ?? 0)} color="bg-blue-500" isLoading={isLoading} />
                <StatCard icon={ClipboardDocumentListIcon} title="পেন্ডিং অর্ডার" value={toBengaliNumber(stats?.pendingOrders ?? 0)} color="bg-yellow-500" isLoading={isLoading} />
                <StatCard icon={CheckCircleIcon} title="কমপ্লিট অর্ডার" value={toBengaliNumber(stats?.completedOrders ?? 0)} color="bg-green-500" isLoading={isLoading} />
                <StatCard icon={CurrencyBangladeshiIcon} title="মোট আয়" value={`৳${toBengaliNumber(stats?.totalRevenue ?? 0)}`} color="bg-indigo-500" isLoading={isLoading} />
            </div>

            <AnalyticsChart data={chartData} isLoading={isLoading} />
        </div>
    );
};

export default AdminDashboard;
