import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, RefreshCw, 
  ShieldCheck, Clock, UserCheck 
} from 'lucide-react';
import { getAdminAuditLogs } from '../../services/api';

export default function AdminAuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminAuditLogs(100);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      l.action?.toLowerCase().includes(q) ||
      l.entity_type?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      String(l.entity_id || '').includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              TAMPER-EVIDENT TRAIL
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SECURE GOVERNANCE
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Administrative Audit Trail & Access Registry
          </h1>
          <p className="text-xs text-slate-400">
            Chronological audit log recording every regulator intervention, report export, anomaly resolution, and status modification.
          </p>
        </div>

        <button 
          onClick={loadLogs}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audit logs by action, entity, details..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Operational Details</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white">#{l.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-emerald-400 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">{l.entity_type}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {l.entity_id ? `#${l.entity_id}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">Admin (CPCB Desk)</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-sm truncate">
                    {l.details || 'System operation executed'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                    {l.timestamp}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit logs found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
