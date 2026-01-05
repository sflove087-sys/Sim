import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthPage from './components/auth/AuthPage';
import Layout from './components/common/Layout';
import { User } from './types';
import { apiLogout, apiUpdateFcmToken } from './services/api';
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

  // This effect runs when the user logs in or the app loads with a logged-in user.
  // It checks for a Firebase Cloud Messaging (FCM) token on the window object.
  // This token is expected to be injected by a native Android/iOS wrapper (e.g., in a WebView).
  // If a new or different token is found, it's sent to the backend to be stored.
  useEffect(() => {
    const syncFcmToken = async () => {
      // For testing in a browser, you can manually set it in the console: (window as any).FCM_TOKEN = "your-test-token";
      const fcmToken = (window as any).FCM_TOKEN;

      // Only proceed if we have a user, a token, and the token is different from the one we have stored.
      if (user && fcmToken && user.fcmToken !== fcmToken) {
        try {
          console.log(`New FCM token detected, updating...`);
          await apiUpdateFcmToken(fcmToken);
          // Optimistically update the user object in state and localStorage to prevent re-sends.
          const updatedUser = { ...user, fcmToken };
          login(updatedUser);
          console.log("FCM token updated successfully on the frontend.");
        } catch (error) {
          console.error("Failed to update FCM token:", error);
        }
      }
    };
    syncFcmToken();
  }, [user, login]);

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
