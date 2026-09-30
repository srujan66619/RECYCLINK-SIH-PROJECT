import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Recycle, ShieldCheck, Cpu, MapPin, Globe, UserCheck, 
  Wifi, WifiOff, PlayCircle, LogOut, Sparkles, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LanguageSelector from './common/LanguageSelector';

export default function Navbar({ activeView, setActiveView, onStartDemo, isOffline, setIsOffline }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, quickSwitchRole, logout } = useAuth();
  const { locale, changeLanguage, t } = useI18n();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isCollector = location.pathname.startsWith('/collector');
  const isRecycler = location.pathname.startsWith('/recycler') || activeView === 'recycler';
  const isTrace = location.pathname.startsWith('/trace') || activeView === 'trace';
  const isAdmin = location.pathname.startsWith('/admin') || activeView === 'admin';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => {
            if (setActiveView) setActiveView('landing');
            navigate('/');
          }} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Recycle className="w-5 h-5 text-emerald-400 group-hover:rotate-180 transition duration-700" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-white">RECYCLINK</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SIH 2026
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {t('tagline', 'From Informal Collection to Formal Recycling.')}
            </p>
          </div>
        </div>

        {/* Center Nav Views */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => {
              if (setActiveView) setActiveView('collector');
              navigate('/collector/dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isCollector 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('start_as_collector', 'Collector View')}
          </button>
          <button
            onClick={() => {
              if (setActiveView) setActiveView('recycler');
              navigate('/recycler');
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isRecycler 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('recycler_login', 'Recycler Portal')}
          </button>
          <button
            onClick={() => {
              if (setActiveView) setActiveView('trace');
              navigate('/trace');
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isTrace 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('track_ewaste', 'Trace Explorer')}
          </button>
          <button
            onClick={() => {
              navigate('/passport/RC-2026-000241');
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              location.pathname.startsWith('/passport')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Digital Passport
          </button>
          <button
            onClick={() => {
              if (setActiveView) setActiveView('admin');
              navigate('/admin');
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isAdmin 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('admin_gov', 'CPCB / Admin')}
          </button>
        </nav>

        {/* Right Tools: Demo Button, Role Switcher, Offline Toggle, Language */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* 90-Second Hackathon Judge Demo Button */}
          <button
            onClick={onStartDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition"
            title="Run guided 90-second evaluation tour for SIH judges"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Judge Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Offline/Online toggle simulator */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              isOffline 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
            title={isOffline ? "Currently simulating offline mode. Drafts stored in IndexedDB." : "Connected to RECYCLINK cloud API."}
          >
            {isOffline ? <WifiOff className="w-3 h-3 text-rose-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
          </button>

          {/* National Language Selector (8 Languages) */}
          <LanguageSelector />

          {/* Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 text-xs font-medium"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[80px] sm:max-w-none truncate">{user?.role || 'Switch Role'}</span>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-slate-700 shadow-2xl p-1 z-50">
                <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Persona
                </div>
                <button
                  onClick={() => { quickSwitchRole('COLLECTOR'); setActiveView('collector'); setRoleMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${user?.role === 'COLLECTOR' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>Kabadiwala / Collector</span>
                  <span className="text-[10px] text-slate-500">Mobile PWA</span>
                </button>
                <button
                  onClick={() => { quickSwitchRole('RECYCLER'); setActiveView('recycler'); setRoleMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${user?.role === 'RECYCLER' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>Authorized Recycler</span>
                  <span className="text-[10px] text-slate-500">Portal</span>
                </button>
                <button
                  onClick={() => { quickSwitchRole('ADMIN'); setActiveView('admin'); setRoleMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${user?.role === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>CPCB / Govt Officer</span>
                  <span className="text-[10px] text-slate-500">Analytics</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
