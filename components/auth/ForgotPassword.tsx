
import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface ForgotPasswordProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            addToast(`পাসওয়ার্ড রিসেট লিংক ${email} এ পাঠানো হয়েছে।`, 'success');
            setView('login');
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-2">পাসওয়ার্ড রিসেট</h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">আপনার ইমেইল এড্রেস দিন, আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি লিংক পাঠাবো।</p>
            <Input 
                id="email" 
                label="ইমেইল" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
            />
            <Button type="submit" isLoading={isLoading}>
                লিংক পাঠান
            </Button>
            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setView('login')}
                    className="font-medium text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    লগইন পেজে ফিরে যান
                </button>
            </div>
        </form>
    );
};

export default ForgotPassword;
   