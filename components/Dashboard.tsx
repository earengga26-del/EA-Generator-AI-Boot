import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { apiKey, apiKeys, currentKeyIndex, addApiKey, removeApiKey, isApiKeySet } = useApiKey();
    const [tempApiKey, setTempApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(!isApiKeySet);

    const handleAddApiKey = () => {
        if (tempApiKey.trim()) {
            addApiKey(tempApiKey.trim());
            setTempApiKey('');
        }
    };

    const handleRemoveApiKey = (index: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus API key ini?')) {
            removeApiKey(index);
        }
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
                
                {/* API Keys Management Section */}
                <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Manajemen API Keys</h3>
                    
                    {/* Current API Keys List */}
                    {apiKeys.length > 0 && (
                        <div className="mb-6 space-y-3">
                            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                                <span>API Keys Tersimpan: {apiKeys.length}</span>
                                <span className="text-green-400">Aktif: Key #{currentKeyIndex + 1}</span>
                            </div>
                            {apiKeys.map((key, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-md ${
                                        index === currentKeyIndex 
                                            ? 'bg-green-900/30 border border-green-500/30' 
                                            : 'bg-slate-700 border border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {index === currentKeyIndex && (
                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                            </svg>
                                        )}
                                        <span className="text-slate-300 font-mono text-sm">
                                            Key #{index + 1}: {key.substring(0, 10)}...{key.substring(key.length - 4)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveApiKey(index)}
                                        disabled={apiKeys.length === 1}
                                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New API Key Section */}
                    {(showApiKeyInput || apiKeys.length === 0) && (
                        <div className="space-y-4">
                            <p className="text-slate-400 text-sm mb-4">
                                {apiKeys.length === 0 
                                    ? 'Masukkan API Key pertama Anda untuk memulai.' 
                                    : 'Tambahkan API Key cadangan untuk rotasi otomatis saat limit tercapai.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <input
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddApiKey()}
                                    placeholder="Masukkan Gemini API Key..."
                                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                                />
                                <button
                                    onClick={handleAddApiKey}
                                    disabled={!tempApiKey.trim()}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                    {apiKeys.length === 0 ? 'Simpan' : 'Tambah Key'}
                                </button>
                            </div>
                            {apiKeys.length > 0 && (
                                <button
                                    onClick={() => setShowApiKeyInput(false)}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    Tutup
                                </button>
                            )}
                        </div>
                    )}

                    {/* Show Add Button when input is hidden */}
                    {apiKeys.length > 0 && !showApiKeyInput && (
                        <button
                            onClick={() => setShowApiKeyInput(true)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            + Tambah API Key Cadangan
                        </button>
                    )}

                    {/* Instructions */}
                    <div className="mt-6 text-left space-y-2 pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-400">💡 Fitur Rotasi Otomatis:</p>
                        <ul className="text-sm text-slate-400 list-disc list-inside space-y-1 ml-2">
                            <li>Sistem akan otomatis beralih ke API key berikutnya jika key saat ini mencapai limit</li>
                            <li>Tambahkan beberapa API key untuk menghindari gangguan saat satu key mencapai batas</li>
                            <li>API key aktif ditandai dengan ✓ hijau</li>
                        </ul>
                        <p className="text-sm text-slate-400 mt-4">Cara mendapatkan API Key:</p>
                        <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1 ml-2">
                            <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">Google AI Studio</a></li>
                            <li>Login dengan akun Google Anda</li>
                            <li>Buat API Key baru atau gunakan yang sudah ada</li>
                            <li>Copy dan paste API Key di atas</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
