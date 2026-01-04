import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthPage from './components/auth/AuthPage';
import Layout from './components/common/Layout';
import { User } from './types';
import { apiLogout } from './services/api';
import { WalletProvider } from './context/WalletContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import { safeLocalStorage } from './utils/storage';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = safeLocalStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse stored user, clearing session:", error);
      safeLocalStorage.removeItem('currentUser');
      return null;
    }
  });

  const login = useCallback((loggedInUser: User) => {
    safeLocalStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout(); // This will now clear all local storage
    setUser(null);
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    login,
    logout
  }), [user, login, logout]);

  return (
    <LanguageProvider>
      <ToastProvider>
          <AuthProvider value={authContextValue}>
              <div className="min-h-screen text-slate-700 dark:text-slate-300">
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
    </LanguageProvider>
  );
}

export default App;