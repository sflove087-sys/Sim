import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { apiLogin } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingModal from '../common/LoadingModal';
import { DevicePhoneMobileIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const Login: React.FC<LoginProps> = ({ setView }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  const isMobileInput = useMemo(() => /^\d*$/.test(loginId), [loginId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
        addToast('অনুগ্রহ করে সকল ঘর পূরণ করুন।', 'error');
        return;
    }
    setIsLoading(true);
    try {
        let processedLoginId = loginId;
        // Handle cases where user enters 10 digits starting with 1 (e.g., 1712345678) instead of 017...
        if (isMobileInput) {
            if (loginId.length === 10 && loginId.startsWith('1')) {
                processedLoginId = '0' + loginId;
            }
        }

        const user = await apiLogin({ loginId: processedLoginId, pass: password });
        addToast('লগইন সফল হয়েছে!', 'success');
        login(user);
    } catch (error) {
        const err = error as Error;
        addToast(err.message, 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  const baseInputClass = "w-full py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition duration-200";

  return (
    <>
      <LoadingModal isOpen={isLoading} />
       <div className="text-center mb-8">
            <div className="mb-4">
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animated-gradient-text">
                    ডিজিটাল সেবা
                </h1>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">স্বাগতম!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">আপনার একাউন্টে লগইন করুন</p>
        </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="loginId" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                মোবাইল অথবা ইমেইল
            </label>
            <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    {isMobileInput 
                        ? <DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" />
                        : <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                    }
                </div>
                 {isMobileInput && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-12">
                        <span className="text-slate-500 dark:text-slate-400 text-base">+880</span>
                        <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 ml-2"></div>
                    </div>
                )}
                <input
                    type="text"
                    id="loginId"
                    name="loginId"
                    autoComplete={isMobileInput ? "tel" : "email"}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={`${baseInputClass} ${isMobileInput ? 'pl-28' : 'pl-12'} pr-4`}
                    placeholder={isMobileInput ? "171 234 5678" : "example@email.com"}
                    required
                />
            </div>
        </div>
        
        <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                পাসওয়ার্ড
            </label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${baseInputClass} pl-12 pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                    {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                        <EyeIcon className="h-5 w-5" />
                    )}
                </button>
            </div>
             <div className="text-right mt-2">
                 <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    পাসওয়ার্ড ভুলে গেছেন?
                </button>
            </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isLoading}>
              সাইন ইন করুন
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">একাউন্ট নেই? </span>
          <button
            type="button"
            onClick={() => setView('signup')}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            এখানে রেজিস্টার করুন
          </button>
        </div>
      </form>
    </>
  );
};

export default Login;