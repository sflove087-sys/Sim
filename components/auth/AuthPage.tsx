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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <CircleStackIcon className="mx-auto h-12 w-12 text-indigo-600" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">ডিজিটাল সেবা</h1>
            <p className="mt-2 text-md text-slate-500 dark:text-slate-400">আপনার একাউন্টে লগইন করুন</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 transition-all duration-500 border border-slate-200 dark:border-slate-700">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;