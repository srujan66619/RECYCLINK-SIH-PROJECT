import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, QrCode, ArrowRight, Home, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function CollectorLotSuccess() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const lot = state.lot || {
    id: 1,
    lot_id: 'LOT-2026-000001',
    trace_id: 'RC-2026-000001',
    material_name: 'Printed Circuit Board (PCB)',
    estimated_weight: 2.4,
    status: 'DRAFT',
    qr_code_url: '',
  };
  const recycler = state.recycler || {
    facility_name: 'GreenCycle E-Waste Technologies',
  };

  const [copied, setCopied] = useState(false);

  const handleCopyTrace = () => {
    navigator.clipboard.writeText(lot.trace_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 pb-6 text-center">
      {/* Success Badge */}
      <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/60 animate-bounce">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
          CHAIN-OF-CUSTODY MANIFEST INITIATED
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight">
          {t('lot_created_success') || 'LOT CREATED SUCCESSFULLY'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Your e-waste is now registered in the formal circular economy ledger.
        </p>
      </div>

      {/* Main Success Card with QR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-left">
        {/* Trace ID Hero Display */}
        <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            {t('trace_id_label') || 'Circular Trace ID'}
          </span>
          <div className="text-xl font-mono font-black text-emerald-400 tracking-wider">
            {lot.trace_id}
          </div>
          <button
            onClick={handleCopyTrace}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Trace ID'}</span>
          </button>
        </div>

        {/* Scannable QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl">
          {lot.qr_code_url ? (
            <img src={lot.qr_code_url} alt={`QR for ${lot.trace_id}`} className="w-40 h-40 object-contain" />
          ) : (
            <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-950 font-mono text-xs">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-700 mt-2 font-mono uppercase">
            Scan at Certified Weighing Scale
          </span>
        </div>

        {/* Lot Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-800">
          <div>
            <span className="text-slate-500 block">Material:</span>
            <span className="text-white font-bold">{lot.material_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Certified Weight:</span>
            <span className="text-white font-bold">{lot.estimated_weight} kg</span>
          </div>
          <div>
            <span className="text-slate-500 block">Assigned Recycler:</span>
            <span className="text-white font-bold truncate block">{recycler.facility_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Status:</span>
            <span className="text-emerald-400 font-bold uppercase">
              {t('status_awaiting_recycler') || 'Awaiting Pickup'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => navigate(`/collector/lots/${lot.id || 1}`)}
          className="w-full min-h-[48px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 active:scale-[0.98] transition"
        >
          <span>{t('view_lot_btn') || 'VIEW LOT DETAILS'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/collector/dashboard')}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t('back_to_home_btn') || 'BACK TO HOME'}</span>
        </button>
      </div>
    </div>
  );
}
