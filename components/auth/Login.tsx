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
  
  const baseInputClass = "w-full py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 focus:ring-teal-500/80 focus:border-teal-500 transition duration-200";

  return (
    <>
      <LoadingModal isOpen={isLoading} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="loginId" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                মোবাইল অথবা ইমেইল
            </label>
            <div className="relative rounded-xl shadow-sm">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    {isMobileInput 
                        ? <DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" />
                        : <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                    }
                </div>
                 {isMobileInput && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-11">
                        <span className="text-slate-500 dark:text-slate-400 text-[15px]">+880</span>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 ml-2"></div>
                    </div>
                )}
                <input
                    type="text"
                    id="loginId"
                    name="loginId"
                    autoComplete={isMobileInput ? "tel" : "email"}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={`${baseInputClass} ${isMobileInput ? 'pl-[92px] pr-4' : 'pl-11 pr-4'}`}
                    placeholder={isMobileInput ? "171 234 5678" : "example@email.com"}
                    required
                />
            </div>
        </div>
        
        <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                পাসওয়ার্ড
            </label>
            <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${baseInputClass} pl-11 pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                    className="text-[13px] font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400"
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

        <div className="text-center text-[13px]">
          <span className="text-slate-500 dark:text-slate-400">একাউন্ট নেই? </span>
          <button
            type="button"
            onClick={() => setView('signup')}
            className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400"
          >
            এখানে রেজিস্টার করুন
          </button>
        </div>
      </form>
    </>
  );
};

export default Login;