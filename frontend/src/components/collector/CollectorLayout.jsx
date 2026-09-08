import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Camera, Package, Wallet, User as UserIcon, Globe, Sparkles } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import NetworkStatusBadge from './NetworkStatusBadge';

export function CollectorLayout() {
  const { t, language, changeLanguage } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/collector/dashboard', icon: Home, label: t('nav_home') || 'Home' },
    { to: '/collector/identify', icon: Camera, label: t('nav_identify') || 'Identify' },
    { to: '/collector/lots', icon: Package, label: t('nav_lots') || 'Lots' },
    { to: '/collector/earnings', icon: Wallet, label: t('nav_earnings') || 'Earnings' },
    { to: '/collector/profile', icon: UserIcon, label: t('nav_profile') || 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div 
            onClick={() => navigate('/collector/dashboard')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">RECYCLINK</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">Collector App</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NetworkStatusBadge />

            {/* Language Switcher */}
            <div className="relative flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium text-xs"
              >
                <option value="en" className="bg-slate-900 text-white">EN</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी</option>
                <option value="mr" className="bg-slate-900 text-white">मराठी</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Fixed Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 py-1.5 px-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 min-h-[52px]
                ${isActive
                  ? 'text-emerald-400 bg-emerald-950/60 font-semibold shadow-inner shadow-emerald-900/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
                }
              `}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[11px] leading-tight truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default CollectorLayout;
