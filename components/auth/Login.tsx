
import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { apiLogin } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { User } from '../../types';

interface LoginProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const Login: React.FC<LoginProps> = ({ setView }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
        addToast('অনুগ্রহ করে সকল ঘর পূরণ করুন।', 'error');
        return;
    }
    setIsLoading(true);
    try {
        let processedLoginId = loginId;
        // মোবাইল নম্বর স্বাভাবিক করার জন্য: যদি শুধুমাত্র সংখ্যা থাকে এবং 1 দিয়ে শুরু হয়ে 10 সংখ্যার হয়,
        // তাহলে শুরুতে '0' যোগ করা হবে।
        if (/^\d+$/.test(loginId) && loginId.length === 10 && loginId.startsWith('1')) {
            processedLoginId = '0' + loginId;
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="loginId"
        label="মোবাইল অথবা ইমেইল"
        type="text"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        placeholder="017..."
        required
      />
      <Input
        id="password"
        label="পাসওয়ার্ড"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      <Button type="submit" isLoading={isLoading}>
        লগইন করুন
      </Button>
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => setView('forgot')}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </button>
      </div>
      <div className="text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">একাউন্ট নেই? </span>
        <button
          type="button"
          onClick={() => setView('signup')}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          নতুন একাউন্ট করুন
        </button>
      </div>
    </form>
  );
};

export default Login;
