import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, ShieldAlert, CheckCircle2, 
  X, Filter, Search, ArrowRight, Eye, RefreshCw 
} from 'lucide-react';
import { getAdminAnomalies, updateAdminAnomalyStatus } from '../../services/api';

export default function AdminAnomaliesView() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAnomalies();
  }, [statusFilter, severityFilter]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const data = await getAdminAnomalies({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined
      });
      setAnomalies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await updateAdminAnomalyStatus(selectedAlert.id, newStatus, actionNotes);
      setMessage(`Alert #${selectedAlert.id} successfully updated to ${newStatus}`);
      setSelectedAlert(null);
      setActionNotes('');
      loadAnomalies();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to update alert status');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = anomalies.filter((a) => {
    const q = searchQuery.toLowerCase();
    return !q || 
      a.alert_type?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      String(a.id).includes(q) ||
      String(a.transaction_id || '').includes(q) ||
      String(a.lot_id || '').includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AI TRANSACTION GUARDIAN
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              SURVEILLANCE ACTIVE
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Anomaly Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time surveillance detecting predatory underbidding, weight-rate mismatches, and abnormal informal pricing.
          </p>
        </div>

        <button 
          onClick={loadAnomalies}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anomalies by ID, alert type, transaction..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High / Critical</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Anomalies */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Txn / Lot</th>
                <th className="py-3 px-4">Expected vs Actual</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white">#{a.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{a.alert_type}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      a.severity === 'HIGH' || a.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : a.severity === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {a.transaction_id ? `TX-${a.transaction_id}` : a.lot_id ? `LOT-${a.lot_id}` : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {a.expected_value ? `₹${a.expected_value}` : 'Bench'} vs <span className="text-white font-bold">₹{a.actual_value}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-400">
                    {a.deviation_pct ? `${a.deviation_pct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.status === 'OPEN'
                        ? 'bg-amber-500/20 text-amber-300'
                        : a.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedAlert(a);
                        setActionNotes('');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No anomaly alerts found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & RESOLUTION MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Anomaly Investigation: Alert #{selectedAlert.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Details */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Anomaly Type:</span>
                <span className="font-bold text-white">{selectedAlert.alert_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity:</span>
                <span className="font-bold text-rose-400">{selectedAlert.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Associated Reference:</span>
                <span className="font-mono text-slate-300">
                  {selectedAlert.transaction_id ? `Transaction #${selectedAlert.transaction_id}` : `Lot #${selectedAlert.lot_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deviation Percentage:</span>
                <span className="font-mono font-bold text-rose-400">
                  {selectedAlert.deviation_pct ? `${selectedAlert.deviation_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1">Algorithmic Detection Reason:</span>
                <p className="text-slate-200 italic leading-relaxed">
                  "{selectedAlert.description || selectedAlert.reason || 'Quoted price significantly deviates from CPCB index benchmark.'}"
                </p>
              </div>
            </div>

            {/* Admin Action Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">
                Administrative Audit Notes (Mandatory for record):
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Document regulator findings, recycler explanation, or corrective measure..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                disabled={actionLoading}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
              >
                Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={actionLoading}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus('DISMISSED')}
                disabled={actionLoading}
                className="px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
