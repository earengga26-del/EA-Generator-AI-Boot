import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { apiKey, setApiKey, isApiKeySet } = useApiKey();
    const [tempApiKey, setTempApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(!isApiKeySet);

    const handleSaveApiKey = () => {
        if (tempApiKey.trim()) {
            setApiKey(tempApiKey.trim());
            setShowApiKeyInput(false);
            setTempApiKey('');
        }
    };

    const handleClearApiKey = () => {
        setApiKey('');
        setTempApiKey('');
        setShowApiKeyInput(true);
    };

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <svg viewBox="0 0 40 40" className="w-16 h-16 text-green-500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2.5L35 11.25V28.75L20 37.5L5 28.75V11.25L20 2.5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 37.5V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M35 11.25L20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 11.25L20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M27.5 7.5L12.5 16.25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h1 className="text-5xl font-bold text-white tracking-tight">
                        <span className="text-green-500">EA-AI</span> Studio
                    </h1>
                </div>
                <h2 className="text-2xl font-semibold text-slate-300">
                    Selamat Datang Kembali, <span className="text-green-400">{user?.email}</span>
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-slate-400">
                    Pilih alat dari sidebar untuk memulai perjalanan kreatif Anda. Ubah ide menjadi video, cerita, dan banyak lagi dengan kekuatan AI.
                </p>

                {/* API Key Configuration Section */}
                <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Konfigurasi API Key</h3>
                    
                    {isApiKeySet && !showApiKeyInput ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-green-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>API Key sudah terkonfigurasi</span>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowApiKeyInput(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                >
                                    Ubah API Key
                                </button>
                                <button
                                    onClick={handleClearApiKey}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                >
                                    Hapus API Key
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-slate-400 mb-4">
                                Masukkan Gemini API Key Anda untuk menggunakan fitur AI. API Key akan disimpan di localStorage browser Anda.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <input
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
                                    placeholder="Masukkan Gemini API Key..."
                                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                                />
                                <button
                                    onClick={handleSaveApiKey}
                                    disabled={!tempApiKey.trim()}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                    Simpan
                                </button>
                            </div>
                            {isApiKeySet && (
                                <button
                                    onClick={() => setShowApiKeyInput(false)}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    Batal
                                </button>
                            )}
                            <div className="mt-4 text-left space-y-2">
                                <p className="text-sm text-slate-400">Cara mendapatkan API Key:</p>
                                <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                                    <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">Google AI Studio</a></li>
                                    <li>Login dengan akun Google Anda</li>
                                    <li>Buat API Key baru atau gunakan yang sudah ada</li>
                                    <li>Copy dan paste API Key di atas</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
