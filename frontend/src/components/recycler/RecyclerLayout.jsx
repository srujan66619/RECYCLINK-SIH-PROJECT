import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, LayoutDashboard, Inbox, Tag, Truck, Scale, 
  FileText, User, LogOut, ChevronRight, Menu, X, ShieldCheck, 
  ArrowLeftRight, ExternalLink, Bell, Sparkles, QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RecyclerLayout() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/recycler/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recycler/incoming', label: 'Incoming Lots', icon: Inbox },
    { to: '/recycler/offers', label: 'Manage Offers', icon: Tag },
    { to: '/recycler/pickups', label: 'Logistics Pickups', icon: Truck },
    { to: '/recycler/scan', label: 'Scan Trace QR', icon: QrCode },
    { to: '/recycler/handover', label: 'Handover Verification', icon: Scale },
    { to: '/recycler/transactions', label: 'Transactions', icon: FileText },
    { to: '/recycler/profile', label: 'Facility Profile', icon: User },
  ];

  const handleRoleSwitch = (targetRole) => {
    switchRole(targetRole);
    if (targetRole === 'COLLECTOR') {
      navigate('/collector/dashboard');
    } else if (targetRole === 'ADMIN') {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/recycler/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Recycler Identification */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/recycler/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  RECYCLINK <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">RECYCLER PORTAL</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Formal E-Waste Ingestion Control</span>
              </div>
            </Link>
          </div>

          {/* Recycler Facility Meta & Quick Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* CPCB Badge */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                ✓ CPCB LICENSED RECYCLER
              </span>
              <span className="text-[10px] text-emerald-400/70 font-mono">
                {user?.authorization_no || 'AUTH-2026-TS'}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 text-xs">
              <span className="text-slate-400 text-[11px] px-2 hidden sm:inline">Role:</span>
              <button
                onClick={() => handleRoleSwitch('COLLECTOR')}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition text-[11px]"
                title="Switch to Collector Mobile App"
              >
                Collector
              </button>
              <button
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px]"
                title="Active Recycler View"
              >
                Recycler
              </button>
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition text-[11px]"
                title="Switch to CPCB Admin"
              >
                CPCB Admin
              </button>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="hidden lg:block text-right">
                <span className="text-xs font-semibold text-white block truncate max-w-[160px]">
                  {user?.full_name || 'GreenCycle E-Waste'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user?.email || 'recycler@recyclink.in'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-slate-700/60"
                title="Sign out of Recycler Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 space-y-1.5 backdrop-blur-sm">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Operations Hub
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              </NavLink>
            ))}

            {/* Recycler Facility Details Mini Card */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 px-3 pb-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Recycler Status</span>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Formal Custody Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Calibrated scale reconciliation & UPI automated payout active.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <p>RECYCLINK Enterprise Recycler Platform — Compliant with CPCB E-Waste (Management) Rules 2022</p>
      </footer>
    </div>
  );
}
