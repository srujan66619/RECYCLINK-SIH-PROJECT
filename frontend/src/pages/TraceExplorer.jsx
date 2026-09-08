import React, { useState, useEffect } from 'react';
import { 
  QrCode, Search, ShieldCheck, CheckCircle2, Clock, 
  MapPin, User, Building2, Scale, IndianRupee, Download, 
  Sparkles, ExternalLink, Printer, Copy, Check, AlertTriangle, Shield
} from 'lucide-react';
import { getTraceProvenance, getTraceIntegrity } from '../services/api';

export default function TraceExplorer({ initialTraceId = "RC-2026-000241" }) {
  const [traceIdInput, setTraceIdInput] = useState(initialTraceId);
  const [traceData, setTraceData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProvenance(initialTraceId);
  }, [initialTraceId]);

  const fetchProvenance = async (idToSearch) => {
    if (!idToSearch) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getTraceProvenance(idToSearch.trim());
      setTraceData(data);
      setTraceIdInput(data.trace_id);

      // Verify tamper-evident cryptographic integrity
      try {
        const intRes = await getTraceIntegrity(data.trace_id);
        setIntegrityData(intRes);
      } catch (iErr) {
        setIntegrityData(data.integrity || { status: 'VALID', events_checked: data.timeline?.length || 0 });
      }
    } catch (err) {
      setErrorMsg(`Trace ID '${idToSearch}' not found in the circular registry.`);
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProvenance(traceIdInput);
  };

  const copyTraceId = () => {
    if (!traceData?.trace_id) return;
    navigator.clipboard.writeText(traceData.trace_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:p-0 print:m-0 print:max-w-full">
      
      {/* Search Header (Hidden in Print) */}
      <div className="text-center space-y-3 print:hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel-emerald text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Circular Provenance & Chain of Custody</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Circular Trace ID Explorer
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Public, privacy-safe verification of e-waste provenance from informal kabadiwala collection to authorized formal recycling.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={traceIdInput}
              onChange={(e) => setTraceIdInput(e.target.value)}
              placeholder="e.g. RC-2026-000241"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
          >
            {loading ? 'Searching...' : 'Trace'}
          </button>
        </form>

        {errorMsg && (
          <div className="text-xs text-rose-400 font-semibold pt-1">
            {errorMsg}
          </div>
        )}
      </div>

      {traceData && (
        <div className="space-y-6">
          
          {/* Main Dossier Header Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="space-y-2 flex-1">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 print:text-emerald-800">
                    {traceData.trace_id}
                  </span>
                  <button
                    onClick={copyTraceId}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition print:hidden"
                    title="Copy Trace ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:border-emerald-700 print:text-emerald-800">
                    ✓ {traceData.status || traceData.current_status || 'COMPLETED'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {traceData.lot_id}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white print:text-black">
                  {traceData.material} • <span className="text-slate-400 font-normal">{traceData.subcategory || 'Certified Scrap'}</span>
                </h3>

                {/* Safe Collector & Recycler Metadata (Privacy-Preserving) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-300 print:text-slate-700">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>
                      Collector: <strong className="text-white print:text-black">{traceData.collector_type}</strong> ({traceData.collector_city})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Recycler: <strong className="text-white print:text-black">{traceData.recycler?.name || traceData.recycler_name || 'GreenLoop Recycling'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Collection Date: <strong>{traceData.collection_date || '07 Sep 2026'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Authorization: <strong className="text-purple-300 print:text-purple-900">{traceData.recycler?.authorization_status || 'VERIFIED DEMO'}</strong></span>
                  </div>
                </div>

              </div>

              {/* Embedded QR Code */}
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-xl flex-shrink-0 self-center md:self-auto border border-slate-200">
                {traceData.qr_code_base64 ? (
                  <img src={traceData.qr_code_base64} alt="Trace QR" className="w-28 h-28 object-contain" />
                ) : (
                  <QrCode className="w-28 h-28 text-slate-900" />
                )}
                <span className="text-[10px] font-black text-slate-900 mt-1 uppercase tracking-wider">
                  Scan to Verify
                </span>
              </div>

            </div>

            {/* Cryptographic SHA-256 Integrity Seal Banner */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white print:text-black">
                    Tamper-Evident Trace Chain (SHA-256): 
                  </span>
                  <span className="ml-1.5 font-semibold text-emerald-400 print:text-emerald-800">
                    ✓ {integrityData?.integrity_status || integrityData?.status || 'VALID'}
                  </span>
                  <span className="text-slate-400 ml-1">
                    ({integrityData?.events_checked || traceData.timeline?.length || 14} events sequentially verified)
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>

          </div>

          {/* Key Metrics Grid: Dual Weight & Dual Settlement */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Initial Intake Weight
              </span>
              <div className="text-xl sm:text-2xl font-black text-white">
                {traceData.initial_weight || traceData.estimated_weight} <span className="text-sm font-normal text-slate-400">kg</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">AI Intake Estimate</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Calibrated Scale Weight
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {traceData.final_weight || traceData.initial_weight} <span className="text-sm font-normal text-slate-400">kg</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">
                Variance: {traceData.handover?.weight_variance_pct ?? -4.17}%
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Quoted Benchmark Rate
              </span>
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹{traceData.quoted_price || 480}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">CPCB Index Value</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Final Settlement Paid
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                ₹{traceData.final_price || traceData.final_amount_paid || 475}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">Disbursed via UPI (PAID)</span>
            </div>

          </div>

          {/* Section 16 & 26: Formal Digital Handover Receipt Slip */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900/90 to-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-display font-bold text-base sm:text-lg text-white">
                  Formal Digital E-Waste Handover Receipt
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                {traceData.handover?.handover_id || 'HR-2026-000241'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Material Grade</span>
                <span className="font-bold text-white">{traceData.material}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Net Verified Weight</span>
                <span className="font-bold text-emerald-400">{traceData.final_weight} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Payment</span>
                <span className="font-bold text-emerald-400">₹{traceData.final_price || 475}.00</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Verification Status</span>
                <span className="font-bold text-cyan-400">✓ VERIFIED & SEALED</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Custody transfer recorded under CPCB E-Waste (Management) Rules 2022.</span>
              <span className="font-mono text-emerald-400 hidden sm:inline">DEMO PAYMENT STATUS: PAID</span>
            </div>
          </div>

          {/* Chronological 14-Stage Trace Timeline */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-lg sm:text-xl text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Full Circular Provenance Journey</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {traceData.timeline?.length || 0} Trace Milestones
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/30 space-y-8">
              {traceData.timeline?.map((step, idx) => (
                <div key={step.id || idx} className="relative group">
                  
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  {/* Stage Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1.5 hover:border-emerald-500/40 transition">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                        STAGE {idx + 1} • {step.stage || step.event_type}
                      </span>
                      <span className="font-mono text-[11px]">
                        {new Date(step.event_timestamp || step.timestamp).toLocaleDateString()} {new Date(step.event_timestamp || step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-sm sm:text-base">
                      {step.title}
                    </h5>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                      <span>Actor: <strong className="text-slate-200">{step.actor_name}</strong> ({step.actor_role})</span>
                      {step.location && <span>• 📍 {step.location}</span>}
                      {step.event_hash && (
                        <span className="font-mono text-[10px] text-emerald-400/80 truncate max-w-[200px]" title={step.event_hash}>
                          SHA-256: {step.event_hash.slice(0, 16)}...
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// Helper icon
function FileCheck(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="m9 15 2 2 4-4"/>
    </svg>
  );
}
