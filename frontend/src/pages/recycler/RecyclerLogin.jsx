import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Lock, Mail, ArrowRight, 
  Sparkles, CheckCircle, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RecyclerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameOrPhone, setUsernameOrPhone] = useState('recycler@recyclink.in');
  const [password, setPassword] = useState('recycler123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickDemoAccounts = [
    {
      name: 'GreenCycle E-Waste Technologies',
      city: 'Hyderabad, TS',
      email: 'recycler@recyclink.in',
      auth: 'CPCB/AUTH/TS/2026/001',
      materials: 'PCB, Telecom Cables, Li-Ion Batteries'
    },
    {
      name: 'EcoFormal Recovery India Pvt Ltd',
      city: 'Hyderabad, TS',
      email: 'recycler2@recyclink.in',
      auth: 'CPCB/AUTH/TS/2026/002',
      materials: 'Motherboards, Heavy Power Cables'
    },
    {
      name: 'Bharat Circular Refiners Ltd',
      city: 'Hyderabad, TS',
      email: 'recycler3@recyclink.in',
      auth: 'CPCB/AUTH/TS/2026/003',
      materials: 'Server Boards, Industrial Electronics'
    }
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(usernameOrPhone, password);
      if (res?.role === 'RECYCLER') {
        navigate('/recycler/dashboard');
      } else {
        setError(`Logged in as ${res?.role}. You must sign in with a verified RECYCLER account.`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (acc) => {
    setUsernameOrPhone(acc.email);
    setPassword('recycler123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-emerald-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Recycler Operations Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            CPCB Authorized E-Waste Ingestion & Formal Refining Network
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recycler Email or Registered Mobile
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={usernameOrPhone}
                  onChange={(e) => setUsernameOrPhone(e.target.value)}
                  required
                  placeholder="recycler@recyclink.in"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorization Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with CPCB Registry...</span>
              ) : (
                <>
                  <span>Sign In to Recycler Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Recycler Presets */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              1-Click Demo Recycler Accounts
            </span>
            <div className="space-y-1.5">
              {quickDemoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                    usernameOrPhone === acc.email
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-white">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 block">{acc.city} • {acc.auth}</span>
                  </div>
                  {usernameOrPhone === acc.email && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portal Switching & Help */}
        <div className="text-center space-y-2 text-xs text-slate-400">
          <p>
            Are you an informal scrap collector?{' '}
            <Link to="/collector/login" className="text-emerald-400 hover:underline font-semibold">
              Collector PWA Sign In
            </Link>
          </p>
          <p>
            <Link to="/" className="hover:text-white transition">
              ← Return to RECYCLINK Home
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
