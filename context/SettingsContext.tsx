import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect } from 'react';
import { Settings } from '../types';
import { apiFetchSettings } from '../services/api';

interface SettingsContextType {
  settings: Settings | null;
  isLoading: boolean;
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
      setSettings(null); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value = {
    settings,
    isLoading,
    refreshSettings: loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};