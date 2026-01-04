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
import { safeLocalStorage, setSessionUser } from './utils/storage';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = safeLocalStorage.getItem('currentUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setSessionUser(parsedUser); // Initialize in-memory session on app start
      return parsedUser;
    } catch (error) {
      console.error("Failed to parse stored user, clearing session:", error);
      safeLocalStorage.removeItem('currentUser');
      setSessionUser(null); // Ensure in-memory session is also cleared
      return null;
    }
  });

  const login = useCallback((loggedInUser: User) => {
    safeLocalStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    setSessionUser(loggedInUser); // Update in-memory session on login
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout(); // This will clear all local storage
    setSessionUser(null); // Clear in-memory session on logout
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
