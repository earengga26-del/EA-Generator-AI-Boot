import React, { useState, useEffect } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useApiKey } from './contexts/ApiKeyContext';
import type { Tab } from './types';
import EaStory from './components/CtStory';
import AuthPage from './components/AuthPage';
import { Spinner } from './components/Spinner';
import { isSupabaseConfigured } from './lib/supabaseClient';
import SupabaseConfigNotice from './components/SupabaseConfigNotice';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CreativeHub from './components/CreativeHub';
import EaGenerate from './components/CtGenerate';
import ProductPhotoshoot from './components/TikTokAffiliateGenerator';
import VoiceGenerator from './components/VoiceGenerator';

const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Dashboard',
  creativeHub: 'Creative Hub',
  videoPrompt: 'EA-STORY',
  ctGenerate: 'EA-Generator',
  tiktokAffiliate: 'Product Photoshoot',
  voiceGenerator: 'Voice Generator',
};


export default function App() {
  const { t } = useLanguage();
  const { user, loading: authLoading, logout, verifySession } = useAuth();
  const { isInitializing: apiKeyInitializing } = useApiKey();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (!isSupabaseConfigured) {
    return <SupabaseConfigNotice />;
  }

  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      verifySession();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, verifySession]);

  const loading = authLoading || apiKeyInitializing;

  if (loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
            <Spinner className="h-10 w-10" />
        </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'creativeHub':
        return <CreativeHub />;
      case 'ctGenerate':
        return <EaGenerate />;
      case 'videoPrompt':
        return <EaStory />;
      case 'tiktokAffiliate':
        return <ProductPhotoshoot />;
      case 'voiceGenerator':
        return <VoiceGenerator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="bg-slate-900 text-gray-300 font-sans flex h-screen overflow-hidden">
      <Sidebar 
        user={user} 
        logout={logout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <main className="flex-1 flex flex-col overflow-y-hidden">
        <header className="p-6 border-b border-slate-800 flex-shrink-0 flex items-center gap-4">
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <h1 className="text-2xl font-bold text-green-500">
            {TAB_TITLES[activeTab]}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}