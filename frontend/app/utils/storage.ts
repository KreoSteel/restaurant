// Safe localStorage utilities for SSR compatibility
import React from 'react';

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Hook for safely accessing localStorage in React components
export const useLocalStorage = (key: string, defaultValue: string | null = null) => {
  const [value, setValue] = React.useState<string | null>(() => {
    return safeLocalStorage.getItem(key) ?? defaultValue;
  });

  const setStoredValue = React.useCallback((newValue: string | null) => {
    setValue(newValue);
    if (newValue === null) {
      safeLocalStorage.removeItem(key);
    } else {
      safeLocalStorage.setItem(key, newValue);
    }
  }, [key]);

  return [value, setStoredValue] as const;
};

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';
