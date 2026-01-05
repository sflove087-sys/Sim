import React, { useState } from 'react';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiForgotPasswordRequest, apiResetPassword } from '../../services/api';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';

interface ForgotPasswordProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setView }) => {
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [identifier, setIdentifier] = useState(''); // Stores the email/mobile
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await apiForgotPasswordRequest(identifier);
            addToast(response.message, 'success');
            setStep('reset');
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addToast('পাসওয়ার্ড দুটি মেলেনি।', 'error');
            return;
        }

        const passwordErrors = [];
        if (newPassword.length < 8) passwordErrors.push("কমপক্ষে ৮টি অক্ষর");
        if (!/[A-Z]/.test(newPassword)) passwordErrors.push("একটি বড় হাতের অক্ষর (A-Z)");
        if (!/[a-z]/.test(newPassword)) passwordErrors.push("একটি ছোট হাতের অক্ষর (a-z)");
        if (!/[0-9]/.test(newPassword)) passwordErrors.push("একটি সংখ্যা (0-9)");

        if (passwordErrors.length > 0) {
            addToast(`নতুন পাসওয়ার্ডে অবশ্যই ${passwordErrors.join(', ')} থাকতে হবে।`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiResetPassword({ emailOrMobile: identifier, code, newPassword });
            addToast(response.message, 'success');
            setView('login');
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const baseInputClass = "w-full py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition duration-200";

    return (
        <div>
            {step === 'request' ? (
                <>
                    <div className="text-center mb-8">
                        <div className="mb-4">
                            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animated-gradient-text">
                                ডিজিটাল সেবা
                            </h1>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">পাসওয়ার্ড রিসেট</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি কোড পাঠাবো।</p>
                    </div>
                    <form onSubmit={handleRequestSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="identifier" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">ইমেইল বা মোবাইল</label>
                            <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><EnvelopeIcon className="h-5 w-5 text-slate-400" /></div><input id="identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="example@email.com অথবা 017..." required className={`${baseInputClass} pl-12 pr-4`} /></div>
                        </div>
                        <Button type="submit" isLoading={isLoading}>
                            রিসেট কোড পাঠান
                        </Button>
                    </form>
                </>
            ) : (
                <>
                     <div className="text-center mb-8">
                        <div className="mb-4">
                            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animated-gradient-text">
                                ডিজিটাল সেবা
                            </h1>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">নতুন পাসওয়ার্ড সেট করুন</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">আপনার ইমেইলে পাঠানো কোড এবং নতুন পাসওয়ার্ড দিন।</p>
                    </div>
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">রিসেট কোড</label>
                            <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><KeyIcon className="h-5 w-5 text-slate-400" /></div><input id="code" type="text" value={code} onChange={e => setCode(e.target.value)} required className={`${baseInputClass} pl-12 pr-4`} /></div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">নতুন পাসওয়ার্ড</label>
                            <div className="relative">
                                <input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={`${baseInputClass} px-4 pr-12`} />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><span className="sr-only">Toggle new password visibility</span>{showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-1">কমপক্ষে ৮ অক্ষর, ১টি বড় হাতের, ১টি ছোট হাতের অক্ষর এবং ১টি সংখ্যা।</p>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">পাসওয়ার্ড নিশ্চিত করুন</label>
                            <div className="relative">
                                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={`${baseInputClass} px-4 pr-12`} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><span className="sr-only">Toggle confirm password visibility</span>{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button type="submit" isLoading={isLoading}>
                                পাসওয়ার্ড পরিবর্তন করুন
                            </Button>
                        </div>
                    </form>
                </>
            )}
            <div className="text-center mt-6">
                <button
                    type="button"
                    onClick={() => setView('login')}
                    className="font-medium text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    লগইন পেজে ফিরে যান
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;