import { User } from '../types';

const storageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
    try {
        const storage = window[type];
        if (!storage) return false;
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

const hasLocalStorage = storageAvailable('localStorage');

export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        if (!hasLocalStorage) return null;
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error(`Error getting item "${key}" from localStorage:`, e);
            return null;
        }
    },
    setItem: (key: string, value: string): void => {
        if (hasLocalStorage) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.error(`Error setting item "${key}" in localStorage:`, e);
            }
        }
    },
    removeItem: (key: string): void => {
        if (hasLocalStorage) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error(`Error removing item "${key}" from localStorage:`, e);
            }
        }
    },
    clear: (): void => {
        if (hasLocalStorage) {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('Error clearing localStorage:', e);
            }
        }
    },
};

// --- In-memory session user for reliable API calls ---
let currentUser: User | null = null;

export const setSessionUser = (user: User | null): void => {
    currentUser = user;
};

export const getSessionUser = (): User | null => {
    return currentUser;
};
