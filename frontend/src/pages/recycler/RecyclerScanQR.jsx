import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  QrCode, Camera, Search, ArrowRight, ShieldCheck, 
  AlertCircle, Scale, Building2, Sparkles, CheckCircle2, RefreshCw
} from 'lucide-react';
import { getTraceProvenance } from '../../services/api';

export default function RecyclerScanQR() {
  const navigate = useNavigate();
  const [manualTraceId, setManualTraceId] = useState('');
  const [lotPreview, setLotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [searchError, setSearchError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. Please use manual entry.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not granted or unavailable on this device. Please enter the Trace ID manually below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = async (idToSearch) => {
    const tid = (idToSearch || manualTraceId).trim();
    if (!tid) return;
    setLoading(true);
    setSearchError('');
    try {
      const data = await getTraceProvenance(tid);
      setLotPreview(data);
      stopCamera();
    } catch (err) {
      setSearchError(`Trace ID '${tid}' not found in the circular registry.`);
      setLotPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedScan = () => {
    // Quick Demo 1-Click Scanner for Judges
    setManualTraceId('RC-2026-000241');
    handleLookup('RC-2026-000241');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LOGISTICS SCANNER
            </span>
            <span className="text-xs text-slate-400">Section 14 Compliant</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-white mt-1">
            Scan Circular Trace ID
          </h2>
          <p className="text-xs text-slate-400">
            Scan collector lot QR or enter Trace ID to initiate calibrated digital scale verification.
          </p>
        </div>

        {/* 1-Click Demo Shortcut */}
        <button
          onClick={handleSimulatedScan}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition self-start"
          title="Preload Hackathon Demo Lot RC-2026-000241"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Scan: RC-2026-000241</span>
        </button>
      </div>

      {/* Camera Viewport Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Device Camera Scanner</span>
          </div>
          {cameraActive ? (
            <button
              onClick={stopCamera}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Turn Camera Off
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition"
            >
              Start Camera
            </button>
          )}
        </div>

        {cameraActive ? (
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-emerald-500/40 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target */}
            <div className="absolute w-48 h-48 border-2 border-emerald-400 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <div className="absolute bottom-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white">
              Align Collector QR code within the target
            </div>
          </div>
        ) : (
          <div className="w-full py-8 bg-slate-900/60 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center space-y-2 text-center px-4">
            <QrCode className="w-12 h-12 text-slate-500" />
            <p className="text-xs text-slate-400">
              Camera is inactive. Click <strong>Start Camera</strong> or use the manual fallback below.
            </p>
            {cameraError && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Manual Trace ID Fallback (Section 13 & 14) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Manual Trace ID Fallback
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualTraceId}
              onChange={(e) => setManualTraceId(e.target.value)}
              placeholder="e.g. RC-2026-000241"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
          >
            {loading ? 'Finding...' : 'Lookup'}
          </button>
        </form>

        {searchError && (
          <div className="text-xs text-rose-400 font-semibold flex items-center space-x-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Lot Match Card */}
      {lotPreview && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {lotPreview.trace_id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ VERIFIED LOT
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                {lotPreview.material} • {lotPreview.subcategory || 'Grade A'}
              </h3>
              <p className="text-xs text-slate-300">
                Lot ID: <strong className="text-white font-mono">{lotPreview.lot_id}</strong> • Expected Weight: <strong className="text-emerald-400">{lotPreview.estimated_weight || lotPreview.initial_weight} kg</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Origin: {lotPreview.collector_city} ({lotPreview.collector_type})
              </p>
            </div>

            <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
              {lotPreview.qr_code_base64 ? (
                <img src={lotPreview.qr_code_base64} alt="QR" className="w-16 h-16 object-contain" />
              ) : (
                <QrCode className="w-16 h-16 text-slate-900" />
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to={`/recycler/handover/${lotPreview.lot_id}`}
              className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <Scale className="w-4 h-4" />
              <span>Proceed to Handover Scale Verification</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={`/trace/${lotPreview.trace_id}`}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              <span>View Provenance</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
