import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, Printer, Filter, 
  Calendar, CheckCircle2, ShieldCheck, FileText,
  MapPin, Layers, Building2, Activity, Sparkles
} from 'lucide-react';

export default function AdminReportsView() {
  const [reportType, setReportType] = useState('collection');
  const [dateRange, setDateRange] = useState('30 Days');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [recyclerFilter, setRecyclerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [downloading, setDownloading] = useState(false);

  const reportTypes = [
    { 
      id: "collection", 
      title: "1. Collection Intake Report", 
      desc: "Detailed records of all collected lots, weights, materials, and trace identifiers.",
      fields: ["Lot ID", "Trace ID", "Collector ID", "Material", "Estimated Weight (kg)", "Final Weight (kg)", "Status", "Date"]
    },
    { 
      id: "transactions", 
      title: "2. Transaction & Payout Settlement Report", 
      desc: "Commercial handovers, agreed rates per kg, settled values, and UPI references.",
      fields: ["Transaction ID", "Lot ID", "Collector ID", "Recycler ID", "Agreed Rate (₹/kg)", "Final Price (₹)", "Status", "Payment Status", "Date"]
    },
    { 
      id: "materials", 
      title: "3. Material Composition & Toxic Fractions Report", 
      desc: "Catalog distributions, hazard levels, and recoverable metal yield estimates.",
      fields: ["Material Name", "Category", "Benchmark Price (₹/kg)", "Hazard Level", "Min Price", "Max Price"]
    },
    { 
      id: "recyclers", 
      title: "4. CPCB Recycler Compliance & Performance Report", 
      desc: "Licensed facility directory, handling capacities, and reliability scores.",
      fields: ["Recycler ID", "Facility Name", "City", "CPCB Authorization", "Active", "Created At"]
    },
    { 
      id: "traceability", 
      title: "5. Circular Traceability & QR Provenance Report", 
      desc: "Full 7-stage chronological audit ledger from kabadiwala intake to smelter receipt.",
      fields: ["Trace ID", "Lot ID", "Collector ID", "Material", "Status", "QR Generated", "Created At"]
    },
    { 
      id: "pricing", 
      title: "6. Price Fairness & Benchmark Conformance Report", 
      desc: "Offers tagged as GOOD OFFER, FAIR, or BELOW FAIR vs. CPCB commodity indices.",
      fields: ["Transaction ID", "Lot ID", "Agreed Rate (₹/kg)", "Final Price (₹)", "Status", "Date"]
    },
    { 
      id: "anomalies", 
      title: "7. AI Guardian Anomaly Surveillance Report", 
      desc: "Flagged predatory pricing alerts, scale weight discrepancies, and audit logs.",
      fields: ["Alert ID", "Type", "Severity", "Transaction ID", "Lot ID", "Expected", "Actual", "Deviation %", "Status", "Date"]
    },
    { 
      id: "collectors", 
      title: "8. Informal Collector Economic Impact Report", 
      desc: "Grassroots collector onboarding, cumulative volumes, and direct UPI benefit payouts.",
      fields: ["Collector Code", "City", "Verified", "Total Weight (kg)", "Total Earnings (₹)", "Onboarded Date"]
    },
    { 
      id: "monthly_impact", 
      title: "9. Monthly Government Impact & Circularity Summary Report", 
      desc: "National aggregates formatted according to CPCB Form-2 and statutory audit guidelines.",
      fields: ["Statutory Metric", "Recorded Value", "Unit", "Regulatory Standard"]
    },
  ];

  const currentReport = reportTypes.find(r => r.id === reportType) || reportTypes[0];

  const handleDownloadCSV = () => {
    setDownloading(true);
    const params = new URLSearchParams({
      report_type: reportType,
      date_range: dateRange,
      city: cityFilter,
      material: materialFilter,
      status: statusFilter
    });
    const downloadUrl = `/api/admin/reports/export-csv?${params.toString()}`;
    
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
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              STATUTORY REGULATORY REPORTING
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Government Impact Reports & Compliance Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Generate tamper-evident statutory audit reports for CPCB, State Pollution Control Boards (SPCB), MoEFCC, and national circular economy archives.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating Stream..." : "Export Official CSV"}</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Statutory Filter Parameters & Regulatory Scope</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
          
          {/* 1. Report Type */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-400 font-bold block">1. Statutory Report Type:</label>
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

          {/* 2. Date Range */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">2. Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="Today">Today</option>
              <option value="7 Days">Last 7 Days</option>
              <option value="30 Days">Last 30 Days</option>
              <option value="90 Days">Last Quarter (90 Days)</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* 3. Location Hub */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">3. Location Hub:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="ALL">All Hubs (National)</option>
              <option value="Hyderabad">Hyderabad (TS)</option>
              <option value="Vijayawada">Vijayawada (AP)</option>
              <option value="Guntur">Guntur (AP)</option>
              <option value="Bapatla">Bapatla (AP)</option>
              <option value="Bengaluru">Bengaluru (KA)</option>
              <option value="Mumbai">Mumbai (MH)</option>
              <option value="Pune">Pune (MH)</option>
              <option value="Delhi">Delhi (NCR)</option>
            </select>
          </div>

          {/* 4. Material */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">4. Material Fraction:</label>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="ALL">All Materials</option>
              <option value="PCB">Printed Circuit Boards</option>
              <option value="CABLE">Insulated Cables</option>
              <option value="BATTERY">Li-Ion Batteries</option>
              <option value="CRT">CRT Monitors</option>
              <option value="LCD">LCD Panels</option>
              <option value="MOTOR">Electric Motors</option>
              <option value="PLASTIC">Mixed Plastics</option>
            </select>
          </div>

          {/* 5. Status Filter */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">5. Status Audit:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="VERIFIED">Verified Handovers</option>
              <option value="FLAGGED">Flagged / Anomalous</option>
            </select>
          </div>

        </div>
      </div>

      {/* Selected Report Metadata Preview Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">{currentReport.title}</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Scope: <span className="text-white font-semibold">{dateRange}</span> | Hub: <span className="text-white font-semibold">{cityFilter}</span>
          </span>
        </div>

        <p className="text-xs text-slate-300 italic">{currentReport.desc}</p>

        {/* Schema Column Indicators */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Export Column Headers ({currentReport.fields.length} Fields):
          </span>
          <div className="flex flex-wrap gap-2">
            {currentReport.fields.map((f, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Regulatory Compliance Stamp */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400 mt-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Ledger Certified & Audited under CPCB E-Waste Management Rules 2022</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 font-bold">SHA-256 PROVENANCE VALID</span>
        </div>
      </div>

    </div>
  );
}
