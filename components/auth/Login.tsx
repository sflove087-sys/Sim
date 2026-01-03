
import React, { useState, useMemo } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { apiLogin } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingModal from '../common/LoadingModal';

interface LoginProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const Login: React.FC<LoginProps> = ({ setView }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  // ইনপুটটি শুধুমাত্র সংখ্যা হলে মোবাইল নম্বর হিসেবে ধরা হবে
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
        // যদি মোবাইল নম্বর হয়, তবে নম্বরটি স্বাভাবিক করা হবে
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

  return (
    <>
      <LoadingModal isOpen={isLoading} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="loginId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            মোবাইল অথবা ইমেইল
          </label>
          <div className="relative rounded-lg shadow-sm">
            {isMobileInput && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-slate-500 dark:text-slate-400 sm:text-sm font-medium">+880</span>
              </div>
            )}
            <input
              type="text"
              id="loginId"
              name="loginId"
              autoComplete={isMobileInput ? "tel" : "email"}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className={`w-full py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${isMobileInput ? 'pl-16 pr-4' : 'px-4'}`}
              placeholder={isMobileInput ? "171 234 5678" : "example@email.com"}
              required
            />
          </div>
        </div>
        
        <div>
          <Input
            id="password"
            label="পাসওয়ার্ড"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
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