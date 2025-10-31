import React from 'react';
import type { User } from '@supabase/supabase-js';
import type { Tab } from '../types';
import { 
    DashboardIcon, CreativeHubIcon, BrandKitIcon, ChatTutorIcon, 
    GenerationSuiteIcon, StudioSuiteIcon, JagoYtIcon, EaStoryIcon, 
    EaAdvancedIcon, EaProSuiteIcon, InfoIcon, SettingsIcon, 
    UserIcon, LogoutIcon, TikTokIcon, CameraIcon, VoiceGeneratorIcon
} from './icons';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SidebarProps {
  user: User;
  logout: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ icon, label, isActive, onClick, disabled }) => {
  const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left";
  const activeClasses = "bg-green-500 text-white font-semibold";
  const inactiveClasses = "text-gray-400 hover:bg-slate-700 hover:text-gray-200";
  const disabledClasses = "text-gray-500 cursor-not-allowed";

  const getClasses = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isActive) return `${baseClasses} ${activeClasses}`;
    return `${baseClasses} ${inactiveClasses}`;
  };

  return (
    <button onClick={onClick} className={getClasses()} disabled={disabled}>
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <h3 className="px-3 pt-4 pb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
    {label}
  </h3>
);

const Sidebar: React.FC<SidebarProps> = ({ user, logout, activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const handleNavItemClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <aside className={`w-64 bg-slate-800 flex flex-col flex-shrink-0 border-r border-slate-700/50 
                       transition-transform transform duration-300 ease-in-out
                       fixed md:relative md:translate-x-0 h-full z-40 
                       ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50 flex-shrink-0">
         <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="w-8 h-8 text-green-500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2.5L35 11.25V28.75L20 37.5L5 28.75V11.25L20 2.5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 37.5V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M35 11.25L20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 11.25L20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M27.5 7.5L12.5 16.25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
                <h1 className="text-md font-bold text-white leading-tight">EA Generator Bot</h1>
                <p className="text-xs text-gray-400 leading-tight">EA-Generator</p>
            </div>
        </div>
        <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      {/* User Welcome */}
      <div className="px-4 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
              <UserIcon className="w-6 h-6 text-gray-400" />
              <div>
                  <p className="text-sm font-medium text-gray-300">Welcome,</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
              </div>
          </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          <li><NavItem icon={<DashboardIcon />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => handleNavItemClick('dashboard')} /></li>
          <li><NavItem icon={<CreativeHubIcon />} label="Creative Hub" disabled /></li>
          <li><NavItem icon={<BrandKitIcon />} label="Brand Kit" disabled /></li>
          <li><NavItem icon={<ChatTutorIcon />} label="Chat Tutor" disabled /></li>
          
          <li><SectionHeader label="Generation Suite" /></li>
          <li><NavItem icon={<GenerationSuiteIcon />} label="EA-Generator" isActive={activeTab === 'ctGenerate'} onClick={() => handleNavItemClick('ctGenerate')} /></li>
          <li><NavItem icon={<CameraIcon />} label="Product Photoshoot" isActive={activeTab === 'tiktokAffiliate'} onClick={() => handleNavItemClick('tiktokAffiliate')} /></li>
          <li><NavItem icon={<VoiceGeneratorIcon />} label="Voice Generator" isActive={activeTab === 'voiceGenerator'} onClick={() => handleNavItemClick('voiceGenerator')} /></li>
          <li><NavItem icon={<EaStoryIcon />} label="EA-STORY" isActive={activeTab === 'videoPrompt'} onClick={() => handleNavItemClick('videoPrompt')} /></li>
          <li><NavItem icon={<EaAdvancedIcon />} label="EA-ADVANCED" disabled /></li>
          <li><NavItem icon={<EaProSuiteIcon />} label="EA-PRO SUITE" disabled /></li>

          <li><SectionHeader label="Info & Bantuan" /></li>
          <li><NavItem icon={<InfoIcon />} label="Info & Bantuan" disabled /></li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex-shrink-0">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1">
                <button className="p-2 rounded-md text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"><SettingsIcon className="w-5 h-5" /></button>
                <button className="p-2 rounded-md text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"><UserIcon className="w-5 h-5" /></button>
                <button onClick={logout} className="p-2 rounded-md text-gray-400 hover:bg-red-600 hover:text-white transition-colors"><LogoutIcon className="w-5 h-5" /></button>
            </div>
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;