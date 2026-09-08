import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  QrCode, ArrowLeft, Download, ExternalLink, ShieldCheck, 
  Copy, Check, Printer, Sparkles, AlertCircle
} from 'lucide-react';
import { getTraceProvenance } from '../../services/api';

export default function CollectorTraceQR() {
  const { traceId } = useParams();
  const navigate = useNavigate();
  const [lotData, setLotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (traceId) {
      loadTraceData(traceId);
    }
  }, [traceId]);

  const loadTraceData = async (tid) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTraceProvenance(tid);
      setLotData(data);
    } catch (err) {
      setError(`Unable to load QR data for Trace ID: ${tid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!traceId) return;
    navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!lotData?.qr_code_base64) return;
    const link = document.createElement('a');
    link.href = lotData.qr_code_base64;
    link.download = `RECYCLINK-QR-${traceId || 'trace'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Generating Secure Circular QR...</p>
      </div>
    );
  }

  if (error || !lotData) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Trace ID Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Could not locate lot details.'}</p>
        <button
          onClick={() => navigate('/collector/lots')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
        >
          Return to My Lots
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>TAMPER-EVIDENT QR</span>
        </div>
      </div>

      {/* Main Scannable Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center space-y-5 relative overflow-hidden shadow-2xl">
        
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            RECYCLINK CIRCULAR IDENTIFIER
          </span>
          <div className="flex items-center justify-center space-x-2">
            <h2 className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
              {lotData.trace_id}
            </h2>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Copy Trace ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-300">
            {lotData.lot_id} • {lotData.material} ({lotData.estimated_weight} kg)
          </p>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="relative mx-auto w-64 h-64 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          {lotData.qr_code_base64 ? (
            <img
              src={lotData.qr_code_base64}
              alt={`QR for ${lotData.trace_id}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <QrCode className="w-48 h-48 text-slate-900" />
          )}

          {/* Corner Framing accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl-sm"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr-sm"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl-sm"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br-sm"></div>
        </div>

        {/* Instruction Banner */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-left flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-0.5">
            <span className="font-bold text-white block">Handover Verification Instruction</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Show this QR code to the authorized recycler vehicle or yard agent. Scanning this verifies physical custody on calibrated scales.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save QR</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Print Slip</span>
          </button>
        </div>

        <Link
          to={`/trace/${lotData.trace_id}`}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View Public Chain of Custody</span>
        </Link>

      </div>

    </div>
  );
}
