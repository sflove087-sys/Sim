
import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect } from 'react';
import { Wallet } from '../types';
import { fetchWallet } from '../services/api';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  refreshWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadWallet = useCallback(async () => {
    if (!user) return; // Don't fetch if no user is logged in
    setIsLoading(true);
    try {
      const data = await fetchWallet();
      setWallet(data);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
      setWallet(null); // Or handle error state appropriately
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const value = {
    wallet,
    isLoading,
    // Expose the loadWallet function as `refreshWallet` so components can trigger a balance update.
    refreshWallet: loadWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
