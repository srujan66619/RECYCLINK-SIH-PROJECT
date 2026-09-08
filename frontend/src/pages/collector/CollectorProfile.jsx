import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/I18nContext';
import { 
  User, Phone, MapPin, Star, ShieldCheck, 
  Globe, LogOut, Wallet, ShieldAlert, Award, 
  Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CollectorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [savedUpi, setSavedUpi] = useState(user?.collector_profile?.upi_id || '9876543210@upi');
  const [upiEditMode, setUpiEditMode] = useState(false);
  const [newUpi, setNewUpi] = useState(savedUpi);
  const [upiSuccess, setUpiSuccess] = useState(false);

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('recyclink_lang', lng);
  };

  const handleSaveUpi = (e) => {
    e.preventDefault();
    setSavedUpi(newUpi);
    setUpiEditMode(false);
    setUpiSuccess(true);
    setTimeout(() => setUpiSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/collector/login');
  };

  const profile = user?.collector_profile || {};
  const fullName = user?.full_name || 'Ramesh Kumar';
  const phone = user?.phone || '+91 98765 43210';
  const city = profile.city || user?.city || 'Hyderabad, Telangana';
  const rating = profile.rating || 4.9;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {t('profile.title') || 'Collector Profile'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Formal registry status, payout methods, and language settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-br from-emerald-950/50 via-gray-900 to-gray-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-black">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{fullName}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-3 h-3" /> CPCB Registered
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-500" />
                {phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-500" />
                {city}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {rating}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct UPI Settlement Card */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Instant UPI Payout Account</h3>
              <p className="text-xs text-gray-400">Verified funds transfer immediately on lot handover</p>
            </div>
          </div>
          {!upiEditMode && (
            <button
              onClick={() => setUpiEditMode(true)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Change
            </button>
          )}
        </div>

        {upiSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>UPI ID updated successfully for all direct payouts!</span>
          </div>
        )}

        {upiEditMode ? (
          <form onSubmit={handleSaveUpi} className="space-y-2.5 pt-1">
            <input
              type="text"
              value={newUpi}
              onChange={(e) => setNewUpi(e.target.value)}
              placeholder="e.g. mobile@upi or vpa@okhdfcbank"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all"
              >
                Save UPI ID
              </button>
              <button
                type="button"
                onClick={() => setUpiEditMode(false)}
                className="px-3 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/60">
            <span className="font-mono text-sm text-gray-200 font-semibold">{savedUpi}</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        )}
      </div>

      {/* Language Preference Card */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">
              {t('profile.language') || 'App Language'}
            </h3>
            <p className="text-xs text-gray-400">Select preferred language for voice and menus</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { code: 'en', label: 'English', sub: 'English' },
            { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
            { code: 'mr', label: 'मराठी', sub: 'Marathi' }
          ].map((lang) => {
            const isSelected = (i18n.language || 'en').startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white ring-1 ring-emerald-500/40'
                    : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="font-bold text-sm block">{lang.label}</span>
                <span className="text-[10px] text-gray-400">{lang.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful Quick Links */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-2 divide-y divide-gray-800/80 shadow-lg">
        <button
          onClick={() => navigate('/collector/safety')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">Safety Guidelines</span>
              <span className="text-xs text-gray-400">Pictorial rules on battery and chemical hazards</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={() => navigate('/collector/earnings')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">Earnings & Direct Payouts</span>
              <span className="text-xs text-gray-400">Full ledger of digital weighing payouts</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Compliance Footer */}
      <div className="text-center py-2 space-y-1">
        <p className="text-[11px] text-gray-500">
          RECYCLINK v2.4 • Smart India Hackathon 2026 (SIH26229)
        </p>
        <p className="text-[10px] text-gray-600">
          Compliant with Central Pollution Control Board (CPCB) E-Waste Management Rules, 2022
        </p>
      </div>

      {/* Logout Action */}
      <div className="pt-2 pb-6">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm border border-rose-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('profile.logout') || 'Sign Out of Recyclink'}</span>
        </button>
      </div>
    </div>
  );
}
