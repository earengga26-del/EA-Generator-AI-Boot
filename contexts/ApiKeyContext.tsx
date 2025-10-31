import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';

// Konteks dengan support untuk multiple API keys dengan rotasi otomatis
interface ApiKeyContextType {
  apiKey: string;
  apiKeys: string[];
  currentKeyIndex: number;
  setApiKey: (key: string) => void;
  setApiKeys: (keys: string[]) => void;
  addApiKey: (key: string) => void;
  removeApiKey: (index: number) => void;
  rotateApiKey: () => boolean;
  isApiKeySet: boolean;
  isInitializing: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const LOCALSTORAGE_KEYS = 'gemini_api_keys'; // Array of keys
const LOCALSTORAGE_INDEX = 'gemini_current_index'; // Current index

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKeys, setApiKeysState] = useState<string[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fungsi helper untuk memeriksa apakah kunci yang diberikan adalah placeholder.
  const isPlaceholderKey = (key: string | null | undefined): boolean => {
    if (!key) return true;
    return key.toUpperCase().includes('PLACEHOLDER');
  };

  // Get current API key
  const apiKey = useMemo(() => {
    if (apiKeys.length === 0) return '';
    return apiKeys[currentKeyIndex] || apiKeys[0] || '';
  }, [apiKeys, currentKeyIndex]);

  // Fungsi untuk rotate ke API key berikutnya
  const rotateApiKey = useCallback((): boolean => {
    if (apiKeys.length <= 1) return false;
    
    const nextIndex = (currentKeyIndex + 1) % apiKeys.length;
    setCurrentKeyIndex(nextIndex);
    localStorage.setItem(LOCALSTORAGE_INDEX, nextIndex.toString());
    
    console.log(`API key rotated from index ${currentKeyIndex} to ${nextIndex}`);
    return true;
  }, [apiKeys.length, currentKeyIndex]);

  // Fungsi untuk set single API key (backward compatibility)
  const setApiKey = useCallback((key: string) => {
    if (key && !isPlaceholderKey(key)) {
      const newKeys = [key];
      setApiKeysState(newKeys);
      setCurrentKeyIndex(0);
      localStorage.setItem(LOCALSTORAGE_KEYS, JSON.stringify(newKeys));
      localStorage.setItem(LOCALSTORAGE_INDEX, '0');
    } else {
      setApiKeysState([]);
      localStorage.removeItem(LOCALSTORAGE_KEYS);
      localStorage.removeItem(LOCALSTORAGE_INDEX);
    }
  }, []);

  // Fungsi untuk set multiple API keys
  const setApiKeys = useCallback((keys: string[]) => {
    const validKeys = keys.filter(k => k && !isPlaceholderKey(k));
    setApiKeysState(validKeys);
    setCurrentKeyIndex(0);
    
    if (validKeys.length > 0) {
      localStorage.setItem(LOCALSTORAGE_KEYS, JSON.stringify(validKeys));
      localStorage.setItem(LOCALSTORAGE_INDEX, '0');
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEYS);
      localStorage.removeItem(LOCALSTORAGE_INDEX);
    }
  }, []);

  // Fungsi untuk tambah API key baru
  const addApiKey = useCallback((key: string) => {
    if (!key || isPlaceholderKey(key)) return;
    
    const newKeys = [...apiKeys, key];
    setApiKeysState(newKeys);
    localStorage.setItem(LOCALSTORAGE_KEYS, JSON.stringify(newKeys));
  }, [apiKeys]);

  // Fungsi untuk hapus API key
  const removeApiKey = useCallback((index: number) => {
    if (index < 0 || index >= apiKeys.length) return;
    
    const newKeys = apiKeys.filter((_, i) => i !== index);
    setApiKeysState(newKeys);
    
    // Reset current index if needed
    if (currentKeyIndex >= newKeys.length) {
      const newIndex = Math.max(0, newKeys.length - 1);
      setCurrentKeyIndex(newIndex);
      localStorage.setItem(LOCALSTORAGE_INDEX, newIndex.toString());
    }
    
    if (newKeys.length > 0) {
      localStorage.setItem(LOCALSTORAGE_KEYS, JSON.stringify(newKeys));
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEYS);
      localStorage.removeItem(LOCALSTORAGE_INDEX);
    }
  }, [apiKeys, currentKeyIndex]);

  // Logika inisialisasi yang diperbarui untuk menangani localStorage, env, dan backend
  const initializeApiKey = useCallback(async () => {
    setIsInitializing(true);
    
    // Prioritas #1: Cek localStorage (user input) - support multiple keys
    const storedKeysJson = localStorage.getItem(LOCALSTORAGE_KEYS);
    const storedIndex = localStorage.getItem(LOCALSTORAGE_INDEX);
    
    if (storedKeysJson) {
      try {
        const parsed = JSON.parse(storedKeysJson);
        const validKeys = Array.isArray(parsed) 
          ? parsed.filter(k => k && !isPlaceholderKey(k))
          : [];
        
        if (validKeys.length > 0) {
          setApiKeysState(validKeys);
          const index = storedIndex ? parseInt(storedIndex, 10) : 0;
          setCurrentKeyIndex(Math.min(index, validKeys.length - 1));
          setIsInitializing(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored API keys:', e);
      }
    }
    
    // Backward compatibility: check old single key storage
    const oldStoredKey = localStorage.getItem('gemini_api_key');
    if (oldStoredKey && !isPlaceholderKey(oldStoredKey)) {
      const keys = [oldStoredKey];
      setApiKeysState(keys);
      setCurrentKeyIndex(0);
      // Migrate to new format
      localStorage.setItem(LOCALSTORAGE_KEYS, JSON.stringify(keys));
      localStorage.setItem(LOCALSTORAGE_INDEX, '0');
      localStorage.removeItem('gemini_api_key');
      setIsInitializing(false);
      return;
    }

    // Prioritas #2: Cek environment variable di frontend (untuk AI Studio)
    const envApiKey = process.env.API_KEY;
    if (envApiKey && !isPlaceholderKey(envApiKey)) {
      setApiKeysState([envApiKey]);
      setCurrentKeyIndex(0);
      setIsInitializing(false);
      return;
    }

    // Prioritas #3: Jika tidak ada di localStorage/env, ambil dari backend (untuk Vercel)
    try {
      const response = await fetch('/api/get-api-key');
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey && !isPlaceholderKey(data.apiKey)) {
          setApiKeysState([data.apiKey]);
          setCurrentKeyIndex(0);
        }
      } else {
        console.error('Gagal mengambil kunci API default dari backend:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('Tidak dapat mengambil kunci API dari backend (diharapkan di lingkungan dev tanpa server).');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeApiKey();
  }, [initializeApiKey]);

  const isApiKeySet = useMemo(() => apiKeys.length > 0 && !!apiKey && !isPlaceholderKey(apiKey), [apiKeys, apiKey]);

  return (
    <ApiKeyContext.Provider value={{
      apiKey,
      apiKeys,
      currentKeyIndex,
      setApiKey,
      setApiKeys,
      addApiKey,
      removeApiKey,
      rotateApiKey,
      isApiKeySet,
      isInitializing
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
