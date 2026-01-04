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
  const [user, setUser] = useState<User | null>(null);

  // User requested to always load fresh from the sheet, not from localStorage.
  // This effect ensures any lingering session is cleared on app start.
  useEffect(() => {
    safeLocalStorage.removeItem('currentUser');
  }, []);


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