import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, Printer, Filter, 
  Calendar, CheckCircle2, ShieldCheck, FileText 
} from 'lucide-react';

export default function AdminReportsView() {
  const [reportType, setReportType] = useState('collection');
  const [dateRange, setDateRange] = useState('30 Days');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [downloading, setDownloading] = useState(false);

  const reportTypes = [
    { id: "collection", title: "1. Collection Intake Report", desc: "Detailed records of all collected lots, weights, materials, and trace identifiers." },
    { id: "transactions", title: "2. Transaction & Payout Settlement Report", desc: "Commercial handovers, agreed rates per kg, settled values, and UPI references." },
    { id: "materials", title: "3. Material Composition & Toxic Fractions Report", desc: "Catalog distributions, hazard levels, and recoverable metal yield estimates." },
    { id: "recyclers", title: "4. CPCB Recycler Compliance & Performance Report", desc: "Licensed facility directory, handling capacities, and reliability scores." },
    { id: "anomalies", title: "5. AI Guardian Anomaly & Surveillance Report", desc: "Flagged predatory pricing alerts, scale weight discrepancies, and audit logs." },
  ];

  const handleDownloadCSV = () => {
    setDownloading(true);
    const downloadUrl = `/api/admin/reports/export-csv?report_type=${reportType}`;
    
    // Create an anchor and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `recyclink_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              REGULATORY AUDIT REPORTING
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Government Impact Reports & Compliance Exports
          </h1>
          <p className="text-xs text-slate-400">
            Generate tamper-evident statutory audit reports for CPCB, state pollution control boards, and national circular economy archives.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Report Configuration Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Select Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Time Window:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="Today">Today (Live Shifts)</option>
              <option value="7 Days">Last 7 Days</option>
              <option value="30 Days">Last 30 Days</option>
              <option value="90 Days">Quarterly Audit (90 Days)</option>
              <option value="All Time">All Time Historical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Regional Jurisdiction:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="ALL">All Hubs (National Aggregation)</option>
              <option value="Hyderabad">Hyderabad (Telangana)</option>
              <option value="Vijayawada">Vijayawada (Andhra Pradesh)</option>
              <option value="Bengaluru">Bengaluru (Karnataka)</option>
              <option value="Mumbai">Mumbai (Maharashtra)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Report Types Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((r) => (
          <div 
            key={r.id}
            onClick={() => setReportType(r.id)}
            className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
              reportType === r.id 
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{r.title}</h4>
                {reportType === r.id && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">{r.desc}</p>
            </div>
            
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80 text-slate-400">
              <span>Format: Standard CSV / Tabular</span>
              <span className="text-emerald-400 font-semibold">Audit Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Statutory Attestation Footer */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p>
          <strong>Official Declaration:</strong> This report is algorithmically compiled from cryptographic hash-chained lot ledgers and CPCB accredited recycler scale handovers. All transactions conform to E-Waste (Management) Rules, 2022.
        </p>
      </div>

    </div>
  );
}
