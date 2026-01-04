import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthPage from './components/auth/AuthPage';
import Layout from './components/common/Layout';
import { User } from './types';
import { apiLogout } from './services/api';
import { WalletProvider } from './context/WalletContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            // Attempt to parse user data from localStorage
            return JSON.parse(savedUser);
        } catch (error) {
            // If parsing fails (e.g., corrupted data), log the error and clear the item
            console.error("Failed to parse user from localStorage:", error);
            localStorage.removeItem('currentUser');
            return null;
        }
    }
    return null;
  });

  const login = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
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