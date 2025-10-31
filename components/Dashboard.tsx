import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
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
            </div>
        </div>
    );
};

export default Dashboard;