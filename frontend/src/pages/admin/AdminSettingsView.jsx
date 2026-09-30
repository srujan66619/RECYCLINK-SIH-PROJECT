import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Sliders, Database, 
  Lock, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, FileText, Save, Info
} from 'lucide-react';
import { getAdminSettings, updateAdminSettings } from '../../services/api';

export default function AdminSettingsView() {
  const [settingsData, setSettingsData] = useState({
    demo_mode: true,
    system_status: "OPERATIONAL",
    price_anomaly_threshold_pct: 40.0,
    scale_mismatch_threshold_pct: 25.0,
    cpcb_sync_interval_mins: 15,
    data_masking_enabled: true,
    audit_logging_retention_days: 365,
    frontend_url: "http://localhost:5173",
    environment: "development"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getAdminSettings();
        if (data) {
          setSettingsData(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to load admin settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateAdminSettings(settingsData);
      if (updated) {
        setSettingsData(prev => ({ ...prev, ...updated }));
      }
      setSuccessMsg("System configuration successfully saved with statutory audit log.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to update system settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              CENTRAL REGULATORY CONFIGURATION
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            System & Governance Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure CPCB compliance rules, AI Guardian anomaly thresholds, statutory privacy masking, and platform operational parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Configuration"}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: AI GUARDIAN & ANOMALY SURVEILLANCE */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">AI Transaction Guardian & Surveillance Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold">Predatory Underbidding Threshold (% Below Benchmark)</label>
                <span className="font-mono text-amber-400 font-bold text-sm">{settingsData.price_anomaly_threshold_pct}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="60" 
                step="5"
                value={settingsData.price_anomaly_threshold_pct} 
                onChange={(e) => setSettingsData({ ...settingsData, price_anomaly_threshold_pct: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Offers quoting rates below this percentage vs. CPCB commodity benchmark trigger a <strong>HIGH</strong> severity predatory underpricing alert.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold">Scale Reconciliation Discrepancy Threshold (%)</label>
                <span className="font-mono text-purple-400 font-bold text-sm">{settingsData.scale_mismatch_threshold_pct}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="40" 
                step="5"
                value={settingsData.scale_mismatch_threshold_pct} 
                onChange={(e) => setSettingsData({ ...settingsData, scale_mismatch_threshold_pct: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Weight variances between collector estimated weight and recycler calibrated scale exceeding this trigger verification pause.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: PRIVACY & STATUTORY DATA MASKING */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Informal Collector Privacy Protection Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Phone Number Masking</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ENFORCED</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prevents exposure of informal collector personal SIM numbers in administrative and public audit reports.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Domestic Address Masking</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ENFORCED</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Protects collector residential privacy by restricting location displays to city/hub aggregations.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">UPI/Bank Account Masking</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ENFORCED</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ensures collector direct benefit transfers are audited via reference hashes without revealing account numbers.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: CPCB & STATUTORY SYNC PARAMETERS */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Central Pollution Control Board (CPCB) Sync Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Statutory Audit Sync Interval:</label>
              <select
                value={settingsData.cpcb_sync_interval_mins}
                onChange={(e) => setSettingsData({ ...settingsData, cpcb_sync_interval_mins: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold outline-none"
              >
                <option value={5}>Every 5 Minutes (High Frequency)</option>
                <option value={15}>Every 15 Minutes (Default Standard)</option>
                <option value={30}>Every 30 Minutes</option>
                <option value={60}>Every 1 Hour (Batch Export)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Statutory Audit Log Retention:</label>
              <select
                value={settingsData.audit_logging_retention_days}
                onChange={(e) => setSettingsData({ ...settingsData, audit_logging_retention_days: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold outline-none"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year (Statutory E-Waste Rules 2022)</option>
                <option value={1825}>5 Years (Permanent Ledger)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Demonstration Dataset Mode:</label>
              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="demoModeCheck"
                  checked={settingsData.demo_mode}
                  onChange={(e) => setSettingsData({ ...settingsData, demo_mode: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="demoModeCheck" className="text-slate-200 font-semibold cursor-pointer">
                  Display DEMO DATA indicators prominently
                </label>
              </div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
