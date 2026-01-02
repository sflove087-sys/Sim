
import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { apiSignup } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SignupProps {
  setView: (view: 'login' | 'signup' | 'forgot') => void;
}

const Signup: React.FC<SignupProps> = ({ setView }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !mobile || !email || !password) {
            addToast('অনুগ্রহ করে সকল ঘর পূরণ করুন।', 'error');
            return;
        }

        // নতুন পাসওয়ার্ড ভ্যালিডেশন
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-4">নতুন একাউন্ট তৈরি করুন</h2>
            <Input id="name" label="আপনার নাম" type="text" value={name} onChange={e => setName(e.target.value)} required />
            <Input id="mobile" label="মোবাইল নাম্বার" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required />
            <Input id="email" label="ইমেইল" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div>
                <Input id="password" label="পাসওয়ার্ড" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
                    কমপক্ষে ৮ অক্ষর, ১টি বড় হাতের, ১টি ছোট হাতের অক্ষর এবং ১টি সংখ্যা থাকতে হবে।
                </p>
            </div>
            <div className="pt-2">
                <Button type="submit" isLoading={isLoading}>
                    রেজিস্টার করুন
                </Button>
            </div>
            <div className="text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">ইতিমধ্যে একাউন্ট আছে? </span>
                <button
                    type="button"
                    onClick={() => setView('login')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    লগইন করুন
                </button>
            </div>
        </form>
    );
};

export default Signup;
