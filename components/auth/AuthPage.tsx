import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import { CircleStackIcon } from '@heroicons/react/24/solid';

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login setView={setView} />;
      case 'signup':
        return <Signup setView={setView} />;
      case 'forgot':
        return <ForgotPassword setView={setView} />;
      default:
        return <Login setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex justify-center items-center p-4 antialiased">
        <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl grid lg:grid-cols-2 overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Left Branding Panel */}
            <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                 <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 opacity-50"></div>

                <div className="relative z-10 text-center">
                    <CircleStackIcon className="mx-auto h-16 w-16 text-white mb-6 opacity-80" />
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">ডিজিটাল সেবা</h1>
                    <p className="text-indigo-200 text-lg">আপনার বিশ্বস্ত ডিজিটাল ওয়ালেট ও সার্ভিস প্ল্যাটফর্ম।</p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="lg:hidden text-center mb-8">
                     <CircleStackIcon className="mx-auto h-12 w-12 text-indigo-600" />
                     <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">ডিজিটাল সেবা</h1>
                </div>
                {renderView()}
            </div>
        </div>
    </div>
  );
};

export default AuthPage;