import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';

// Konteks dengan setApiKey untuk user input
interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeySet: boolean;
  isInitializing: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const LOCALSTORAGE_KEY = 'gemini_api_key';

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Fungsi helper untuk memeriksa apakah kunci yang diberikan adalah placeholder.
  const isPlaceholderKey = (key: string | null | undefined): boolean => {
    if (!key) return true; // Anggap null, undefined, atau string kosong sebagai placeholder.
    return key.toUpperCase().includes('PLACEHOLDER');
  };

  // Fungsi untuk set API key dengan localStorage support
  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (key && !isPlaceholderKey(key)) {
      localStorage.setItem(LOCALSTORAGE_KEY, key);
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  }, []);

  // Logika inisialisasi yang diperbarui untuk menangani localStorage, env, dan backend
  const initializeApiKey = useCallback(async () => {
    setIsInitializing(true);

    // Prioritas #1: Cek localStorage (user input)
    const storedKey = localStorage.getItem(LOCALSTORAGE_KEY);
    if (storedKey && !isPlaceholderKey(storedKey)) {
      setApiKeyState(storedKey);
      setIsInitializing(false);
      return; // Kunci ditemukan di localStorage
    }

    // Prioritas #2: Cek environment variable di frontend (untuk AI Studio)
    const envApiKey = process.env.API_KEY;
    if (envApiKey && !isPlaceholderKey(envApiKey)) {
        setApiKeyState(envApiKey);
        setIsInitializing(false);
        return; // Kunci ditemukan di env
    }

    // Prioritas #3: Jika tidak ada di localStorage/env, ambil dari backend (untuk Vercel)
    try {
      const response = await fetch('/api/get-api-key');
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey && !isPlaceholderKey(data.apiKey)) {
          setApiKeyState(data.apiKey);
        }
      } else {
        console.error('Gagal mengambil kunci API default dari backend:', response.status, response.statusText);
      }
    } catch (error) {
      // Menangkap error jaringan saat fetch. Diharapkan terjadi di lingkungan dev murni.
      console.log('Tidak dapat mengambil kunci API dari backend (diharapkan di lingkungan dev tanpa server).');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeApiKey();
  }, [initializeApiKey]);

  const isApiKeySet = useMemo(() => !!apiKey && !isPlaceholderKey(apiKey), [apiKey]);

  // Menyediakan nilai konteks dengan setApiKey
  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeySet, isInitializing }}>
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
