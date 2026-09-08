import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Sparkles, QrCode, Cpu, Scale, 
  Leaf, WifiOff, FileCheck, AlertCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function LandingHero({ setActiveView, onStartDemo }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden pb-20">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 text-center">
        
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel-emerald mb-6 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Smart India Hackathon 2026 | PS: SIH26229</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          Making Every E-Waste Transaction <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 bg-clip-text text-transparent">
            Fair, Formal & Traceable.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed mb-10">
          {t('hero_subtitle', 'An AI-powered platform connecting informal e-waste collectors with authorized recyclers through fair pricing, smart matching and digital traceability.')}
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          <button
            onClick={() => {
              if (setActiveView) setActiveView('collector');
              navigate('/collector/dashboard');
            }}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition flex items-center space-x-2"
          >
            <span>{t('start_as_collector', 'Start as Collector')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (setActiveView) setActiveView('recycler');
              navigate('/recycler');
            }}
            className="px-6 py-3.5 rounded-xl glass-panel hover:bg-slate-800 text-white font-semibold text-sm sm:text-base border border-slate-700 hover:border-slate-600 transition"
          >
            {t('recycler_login', 'Recycler Portal')}
          </button>

          <button
            onClick={() => {
              if (setActiveView) setActiveView('trace');
              navigate('/trace');
            }}
            className="px-6 py-3.5 rounded-xl glass-panel hover:bg-slate-800 text-emerald-400 font-semibold text-sm sm:text-base border border-emerald-500/30 hover:border-emerald-500/60 transition flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>{t('track_ewaste', 'Track Trace ID')}</span>
          </button>

          <button
            onClick={onStartDemo}
            className="px-6 py-3.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-bold text-sm sm:text-base transition flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Judge Demo (90s)</span>
          </button>
        </div>

        {/* Live Simulation Ticker */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="glass-panel p-3.5 rounded-xl">
            <span className="text-xs text-slate-400 block">Formalized E-Waste</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-emerald-400">23.9 Tonnes</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">↑ Zero Landfill Leakage</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl">
            <span className="text-xs text-slate-400 block">Informal Kabadiwalas</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-white">450+ Onboarded</span>
            <span className="text-[10px] text-teal-400 block mt-0.5">+32% Average Income Uplift</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl">
            <span className="text-xs text-slate-400 block">Authorized Recyclers</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-white">42 Verified</span>
            <span className="text-[10px] text-blue-400 block mt-0.5">CPCB & State PCB Licensed</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl">
            <span className="text-xs text-slate-400 block">Toxic Fume Risks Prevented</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-amber-400">4,310 kg</span>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">PVC Burning & Acid Baths</span>
          </div>
        </div>

      </section>

      {/* BEFORE vs AFTER Transformational Story */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mb-3">
            The Informal-to-Formal Transformation
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            How RECYCLINK bridges the gap between grassroots collectors and authorized circular refiners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BEFORE CARD */}
          <div className="rounded-2xl p-6 sm:p-8 bg-rose-950/20 border border-rose-900/40 relative">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>BEFORE RECYCLINK (The Broken Status Quo)</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white block">Uncertain & Exploitative Pricing</strong>
                  Informal middlemen quote arbitrary scrap rates without knowing precious metal yield.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white block">Unsafe Backyard Extractions</strong>
                  Burning PVC cables over open bonfires and boiling motherboards in crude acid tanks.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white block">Zero Regulatory Traceability</strong>
                  Over 90% of Indian e-waste leaks into illegal dumps with zero CPCB audit trail.
                </div>
              </li>
            </ul>
          </div>

          {/* AFTER CARD */}
          <div className="rounded-2xl p-6 sm:p-8 bg-emerald-950/20 border border-emerald-500/30 relative shadow-xl shadow-emerald-500/5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>AFTER RECYCLINK (Formalized Ecosystem)</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white block">AI Material Classification & Fair Pricing</strong>
                  Instant computer vision recognition of components and CPCB benchmark market values.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white block">Verified Recycler Direct Matching</strong>
                  Geographic matching with authorized recyclers offering free scheduled pickup.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white block">Circular Trace ID & Digital Handover</strong>
                  Every lot generates a QR code recording intake, scale weight, and CPCB recycling compliance.
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 6 Technology Pillars */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mb-3">
            Intelligent Platform Architecture
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Not a generic classifieds site. A specialized industrial formalization platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">AI Material Identifier</h3>
            <p className="text-sm text-slate-400">
              Computer vision scans PCBs, cables, Li-ion batteries, motors and CRT monitors to detect grade, weight, and recoverable gold/copper.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">Fair-Price Intelligence</h3>
            <p className="text-sm text-slate-400">
              Live regression engine benchmarks open commodity rates to guarantee collectors fair market compensation without exploitation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">Circular Trace ID (QR)</h3>
            <p className="text-sm text-slate-400">
              Every lot receives a unique tamper-evident Trace ID (e.g. RC-2026-000184) mapping complete custody from collection to smelter.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">AI Transaction Guardian</h3>
            <p className="text-sm text-slate-400">
              Anomaly detection module automatically flags predatory underbidding (&gt;40% below fair market) and scale weight discrepancies.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">Offline-First Architecture</h3>
            <p className="text-sm text-slate-400">
              Designed for unreliable field connectivity. Kabadiwalas create offline drafts that automatically synchronize when network is restored.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">Government / CPCB View</h3>
            <p className="text-sm text-slate-400">
              Municipal and environmental regulators gain GIS hotspot visibility into regional collection hubs, formalization rates, and toxic hazards.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 mt-28 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <span className="font-display font-bold text-slate-300">RECYCLINK</span>
          <span>• Smart India Hackathon 2026 Prototype</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Problem Statement: SIH26229</span>
          <span>CPCB E-Waste Rules Aligned</span>
        </div>
      </footer>
    </div>
  );
}
