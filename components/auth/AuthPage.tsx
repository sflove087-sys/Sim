
import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">ডিজিটাল সার্ভিস</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">আপনার একাউন্টে প্রবেশ করুন</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 transition-all duration-500">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
   