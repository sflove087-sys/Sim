
import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthPage from './components/auth/AuthPage';
import Layout from './components/common/Layout';
import { User } from './types';
import { apiLogout } from './services/api';
import { WalletProvider } from './context/WalletContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Check sessionStorage for an existing session on app load
    const savedUser = sessionStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    // Session is now set inside apiLogin
  }, []);

  const logout = useCallback(() => {
    apiLogout(); // Clear session
    setUser(null);
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    login,
    logout
  }), [user, login, logout]);

  return (
    <ToastProvider>
        <AuthProvider value={authContextValue}>
            <div className="min-h-screen text-slate-800 dark:text-slate-200">
                {user ? (
                    <WalletProvider>
                        <SettingsProvider>
                            <Layout />
                        </SettingsProvider>
                    </WalletProvider>
                ) : <AuthPage />}
            </div>
        </AuthProvider>
    </ToastProvider>
  );
}

export default App;