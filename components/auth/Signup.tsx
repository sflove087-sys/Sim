import React, { useState } from 'react';
import Button from '../common/Button';
import { apiSignup } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingModal from '../common/LoadingModal';
import { EyeIcon, EyeSlashIcon, UserIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface SignupProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const Signup: React.FC<SignupProps> = ({ setView }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !mobile || !email || !password) {
            addToast('অনুগ্রহ করে সকল ঘর পূরণ করুন।', 'error');
            return;
        }

        const passwordErrors = [];
        if (password.length < 8) {
            passwordErrors.push("কমপক্ষে ৮টি অক্ষর");
        }
        if (!/[A-Z]/.test(password)) {
            passwordErrors.push("একটি বড় হাতের অক্ষর (A-Z)");
        }
        if (!/[a-z]/.test(password)) {
            passwordErrors.push("একটি ছোট হাতের অক্ষর (a-z)");
        }
        if (!/[0-9]/.test(password)) {
            passwordErrors.push("একটি সংখ্যা (0-9)");
        }

        if (passwordErrors.length > 0) {
            addToast(`পাসওয়ার্ডে অবশ্যই ${passwordErrors.join(', ')} থাকতে হবে।`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            let ipAddress = 'N/A';
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                if(ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    ipAddress = ipData.ip;
                }
            } catch (ipError) {
                console.warn("Could not fetch IP address.", ipError);
            }

            const response = await apiSignup({ name, mobile, email, pass: password, ipAddress });
            addToast(response.message, 'success');
            setView('login');
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const baseInputClass = "w-full py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition duration-200";

    return (
        <>
            <LoadingModal isOpen={isLoading} />
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">নতুন একাউন্ট তৈরি করুন</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">শুরু করতে আপনার বিবরণ দিন</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">আপনার নাম</label>
                    <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><UserIcon className="h-5 w-5 text-slate-400" /></div><input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={`${baseInputClass} pl-12 pr-4`} placeholder="e.g., John Doe"/></div>
                </div>
                <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">মোবাইল নাম্বার</label>
                    <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" /></div><input id="mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required className={`${baseInputClass} pl-12 pr-4`} placeholder="e.g., 01712345678" /></div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ইমেইল</label>
                    <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><EnvelopeIcon className="h-5 w-5 text-slate-400" /></div><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={`${baseInputClass} pl-12 pr-4`} placeholder="e.g., example@email.com" /></div>
                </div>
                <div>
                    <label htmlFor="password-signup" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">পাসওয়ার্ড</label>
                     <div className="relative">
                        <input id="password-signup" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className={`${baseInputClass} pl-4 pr-12`} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-1">
                        কমপক্ষে ৮ অক্ষর, ১টি বড় হাতের, ১টি ছোট হাতের অক্ষর এবং ১টি সংখ্যা থাকতে হবে।
                    </p>
                </div>
                <div className="pt-2">
                    <Button type="submit" disabled={isLoading}>
                        রেজিস্টার করুন
                    </Button>
                </div>
                <div className="text-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">ইতিমধ্যে একাউন্ট আছে? </span>
                    <button type="button" onClick={() => setView('login')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        লগইন করুন
                    </button>
                </div>
            </form>
        </>
    );
};

export default Signup;
