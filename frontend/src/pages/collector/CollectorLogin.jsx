import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, Phone, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export default function CollectorLogin() {
  const { login, loading } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const navigate = useNavigate();

  const [username, setUsername] = useState('collector@recyclink.in');
  const [password, setPassword] = useState('collector123');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const res = await login(username, password);
    if (res.success) {
      navigate('/collector/dashboard');
    } else {
      setError(res.error);
    }
  };

  const handleDemoFill = () => {
    setUsername('collector@recyclink.in');
    setPassword('collector123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Language selector in top right */}
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1">
            ← Home
          </Link>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी</option>
            </select>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center shadow-xl shadow-emerald-950/50 mb-2">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            RECYCLINK
          </h1>
          <p className="text-emerald-400 font-medium text-sm">
            {t('login_subheading') || 'Sell smarter. Recycle safer.'}
          </p>
          <p className="text-xs text-slate-400">
            Smart India Hackathon 2026 • SIH26229
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('phone_or_email') || 'Phone Number or Email'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="9876543210 or collector@recyclink.in"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('password') || 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>{t('login_btn') || 'LOGIN AS COLLECTOR'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Fill Demo Button */}
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-emerald-400 border border-slate-700/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Fill Demo Collector Credentials
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              {t('new_to_recyclink') || 'New to RECYCLINK?'}{' '}
              <Link
                to="/collector/register"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                {t('create_account') || 'Create Collector Account'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
