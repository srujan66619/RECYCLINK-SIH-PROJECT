import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, Phone, User, Mail, MapPin, Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export default function CollectorRegister() {
  const { register, loading } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    city: 'Hyderabad',
    preferred_language: language,
    role: 'COLLECTOR',
  });
  const [error, setError] = useState(null);

  const cities = [
    'Hyderabad', 'Vijayawada', 'Guntur', 'Bapatla',
    'Bengaluru', 'Mumbai', 'Pune', 'Delhi'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const payload = {
      ...formData,
      email: formData.email || `collector_${formData.phone}@recyclink.in`,
      role: 'COLLECTOR',
    };

    const res = await register(payload);
    if (res.success) {
      navigate('/collector/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/collector/login" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1">
            ← Back to Login
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

        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center shadow-lg shadow-emerald-950/50 mb-1">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {t('register_title') || 'Join RECYCLINK'}
          </h1>
          <p className="text-emerald-400 font-medium text-xs">
            {t('register_subheading') || 'Join thousands of smart collectors earning fair prices'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('full_name') || 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kabadiwala"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('phone') || 'Phone Number (10 digits)'} *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('email') || 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('password') || 'Password'} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('city') || 'City'} *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-2 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('preferred_language') || 'Language'}
                </label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="mr">मराठी</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>{t('register_btn') || 'REGISTER AS COLLECTOR'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              {t('already_have_account') || 'Already have an account?'}{' '}
              <Link
                to="/collector/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
