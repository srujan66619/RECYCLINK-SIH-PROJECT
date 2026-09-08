import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../context/I18nContext';
import { 
  ArrowLeft, QrCode, Shield, MapPin, Calendar, Scale, 
  IndianRupee, CheckCircle2, Truck, RefreshCw, Copy, Check,
  AlertTriangle, Building2, ExternalLink
} from 'lucide-react';
import { lotService } from '../../services/lotService';
import { traceService } from '../../services/traceService';
import { LoadingSpinner, ErrorCard } from '../../components/common/StateViews';

export default function CollectorLotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lot, setLot] = useState(null);
  const [provenance, setProvenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const fetchLotData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch lot details
      const lotData = await lotService.getLot(id);
      setLot(lotData);

      // Fetch provenance timeline using trace_id or lot_id
      try {
        const traceData = await traceService.getTrace(lotData.trace_id || id);
        setProvenance(traceData);
      } catch (traceErr) {
        console.warn('Trace fetch warning:', traceErr);
      }
    } catch (err) {
      console.error('Failed to load lot detail:', err);
      setError(err.response?.data?.detail || 'Unable to load lot details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotData();
  }, [id]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(type);
    setTimeout(() => setCopiedId(''), 2000);
  };

  if (loading) {
    return <LoadingSpinner message="Loading e-waste lot details & provenance..." />;
  }

  if (error || !lot) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/collector/lots')}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Lots
        </button>
        <ErrorCard message={error || 'Lot not found'} onRetry={fetchLotData} />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID' || s === 'SETTLED' || s === 'PAYMENT_COMPLETED') {
      return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '💰 Payment Completed' };
    }
    if (s === 'HANDOVER_VERIFIED' || s === 'HANDED_OVER' || s === 'FORMAL_RECYCLING') {
      return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: '✓ Handover Verified' };
    }
    if (s === 'PICKUP_IN_PROGRESS') {
      return { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: '🚚 Pickup in Progress' };
    }
    if (s === 'PICKUP_SCHEDULED') {
      return { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '📦 Pickup Scheduled' };
    }
    if (s === 'ACCEPTED') {
      return { bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30', label: '✓ Recycler Accepted' };
    }
    if (s === 'OFFER_RECEIVED') {
      return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: '🏷️ Offer Received' };
    }
    if (s === 'RECYCLER_SELECTED') {
      return { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Recycler Selected' };
    }
    return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: s || 'Created' };
  };

  const statusBadge = getStatusBadge(lot.status);
  const qrImage = provenance?.qr_code_base64 || lot.qr_code_url;
  const timeline = provenance?.timeline || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/collector/lots')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>My Lots</span>
        </button>
        <button
          onClick={fetchLotData}
          title="Refresh Data"
          className="p-2 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Lot Primary Header Card */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
              {lot.hazard_level && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lot.hazard_level} Hazard
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lot.material_name}
            </h1>
            <p className="text-sm text-gray-400">{lot.subcategory || 'Standard Grade Scrap'}</p>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Est. Payout</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 flex items-center justify-end">
              <IndianRupee className="w-5 h-5" />
              {lot.final_price || lot.quoted_price || lot.recommended_price || 0}
            </span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800/80 text-xs">
          <div className="bg-gray-800/40 p-2.5 rounded-xl border border-gray-800">
            <span className="text-gray-500 block mb-0.5 flex items-center gap-1">
              <Scale className="w-3 h-3 text-cyan-400" /> Weight
            </span>
            <span className="font-semibold text-gray-200 text-sm">
              {lot.final_weight || lot.estimated_weight} kg
            </span>
          </div>
          <div className="bg-gray-800/40 p-2.5 rounded-xl border border-gray-800">
            <span className="text-gray-500 block mb-0.5 flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-emerald-400" /> Unit Rate
            </span>
            <span className="font-semibold text-gray-200 text-sm">
              ₹{lot.estimated_weight > 0 ? Math.round((lot.quoted_price || lot.recommended_price || 0) / lot.estimated_weight) : 0}/kg
            </span>
          </div>
          <div className="bg-gray-800/40 p-2.5 rounded-xl border border-gray-800">
            <span className="text-gray-500 block mb-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> Origin
            </span>
            <span className="font-semibold text-gray-200 text-sm truncate block" title={lot.location_address}>
              {lot.location_address || 'Hyderabad, IN'}
            </span>
          </div>
          <div className="bg-gray-800/40 p-2.5 rounded-xl border border-gray-800">
            <span className="text-gray-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Created
            </span>
            <span className="font-semibold text-gray-200 text-sm">
              {new Date(lot.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code & Digital Manifest Card */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-gray-900/90 to-gray-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* QR Image */}
          <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-200 flex-shrink-0 flex items-center justify-center w-36 h-36">
            {qrImage ? (
              <img 
                src={qrImage} 
                alt="Lot QR Manifest" 
                className="w-full h-full object-contain" 
              />
            ) : (
              <QrCode className="w-20 h-20 text-gray-700" />
            )}
          </div>

          {/* Trace Info & Copy */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Immutable Trace Manifest</span>
            </div>

            {/* Trace ID */}
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Circular Trace ID (CPCB Compliant)</span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                  {lot.trace_id}
                </span>
                <button
                  onClick={() => copyToClipboard(lot.trace_id, 'trace')}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Copy Trace ID"
                >
                  {copiedId === 'trace' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lot ID */}
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Physical Lot ID</span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-xs text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                  {lot.lot_id}
                </span>
                <button
                  onClick={() => copyToClipboard(lot.lot_id, 'lot')}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
                  title="Copy Lot ID"
                >
                  {copiedId === 'lot' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 pt-1">
              Show this QR code to the authorized driver or facility manager during e-waste handover.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/collector/trace/${lot.trace_id}`}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
              >
                <QrCode className="w-4 h-4" />
                <span>SHOW QR</span>
              </Link>
              <Link
                to={`/trace/${lot.trace_id}`}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>VIEW TRACE</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recycler Handover Card (if matched or in transaction) */}
      {provenance?.recycler_name && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4" />
            <span>Authorized Handover Recycler</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-white text-base">{provenance.recycler_name}</h4>
              {provenance.recycler_auth_no && (
                <span className="text-xs text-emerald-400 font-mono block mt-0.5">
                  CPCB Auth: {provenance.recycler_auth_no}
                </span>
              )}
            </div>
            {provenance.final_amount_paid && (
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Settled Amount</span>
                <span className="font-bold text-emerald-400 text-sm">₹{provenance.final_amount_paid}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chain-of-Custody Timeline */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Audit Trail & Chain of Custody</h3>
          </div>
          <span className="text-xs text-gray-400">
            {timeline.length} {timeline.length === 1 ? 'Event' : 'Events'} Logged
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <p>Trace record generated. Physical chain updates will appear here upon dispatch.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-gray-700">
            {timeline.map((event, idx) => {
              const isFirst = idx === 0;
              const isLatest = idx === timeline.length - 1;

              return (
                <div key={event.id || idx} className="relative group">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-gray-950 flex items-center justify-center ${
                    isLatest 
                      ? 'bg-emerald-400 ring-4 ring-emerald-500/20' 
                      : 'bg-cyan-500'
                  }`} />

                  <div className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3.5 rounded-xl border border-gray-700/60">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {event.title || event.event_type}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(event.timestamp || event.event_timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-2">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-700/40">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">By:</span>
                        <span className="font-medium text-gray-300">{event.actor_name}</span>
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.2 rounded">
                          {event.actor_role}
                        </span>
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-0.5 text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {lot.status === 'CREATED' && (
          <button
            onClick={() => navigate('/collector/recyclers', { state: { materialName: lot.material_name, weightKg: lot.estimated_weight, lotId: lot.id } })}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Building2 className="w-4 h-4" />
            <span>Connect to Authorized Recycler</span>
          </button>
        )}
        <button
          onClick={() => navigate('/collector/lots')}
          className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold border border-gray-700 text-center transition-colors"
        >
          Back to Lots List
        </button>
      </div>
    </div>
  );
}
