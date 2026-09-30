import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, LineChart, ShieldCheck, ArrowLeftRight, 
  Users, Building2, Layers, AlertOctagon, BrainCircuit, 
  FileSpreadsheet, ClipboardList, Settings, Menu, X, 
  Search, ShieldAlert, CheckCircle2, ChevronRight, LogOut,
  Sparkles, Filter, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { searchAdmin } from '../../services/api';

export default function AdminLayout({ 
  selectedPeriod: propPeriod, 
  setSelectedPeriod: propSetPeriod, 
  selectedCity: propCity, 
  setSelectedCity: propSetCity 
}) {
  const [internalPeriod, setInternalPeriod] = useState("All Time");
  const [internalCity, setInternalCity] = useState("ALL");

  const selectedPeriod = propPeriod !== undefined ? propPeriod : internalPeriod;
  const setSelectedPeriod = propSetPeriod || setInternalPeriod;
  const selectedCity = propCity !== undefined ? propCity : internalCity;
  const setSelectedCity = propSetCity || setInternalCity;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await searchAdmin(searchQuery);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const [systemStatus, setSystemStatus] = useState("OPERATIONAL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  React.useEffect(() => {
    fetch('/api/health')
      .then(res => res.ok ? setSystemStatus("OPERATIONAL") : setSystemStatus("DELAYED"))
      .catch(() => setSystemStatus("DELAYED"));
  }, []);

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
        { name: "Analytics", path: "/admin/analytics", icon: LineChart },
        { name: "Traceability", path: "/admin/trace", icon: ShieldCheck },
      ]
    },
    {
      title: "Operations",
      items: [
        { name: "Transactions", path: "/admin/transactions", icon: ArrowLeftRight },
        { name: "Collectors", path: "/admin/collectors", icon: Users },
        { name: "Recyclers", path: "/admin/recyclers", icon: Building2 },
        { name: "Materials", path: "/admin/materials", icon: Layers },
        { name: "Anomalies", path: "/admin/anomalies", icon: AlertOctagon },
      ]
    },
    {
      title: "Intelligence",
      items: [
        { name: "AI Insights", path: "/admin/analytics", icon: BrainCircuit },
        { name: "Price Intelligence", path: "/admin/analytics", icon: Sparkles },
        { name: "Recycler Network", path: "/admin/recyclers", icon: Building2 },
      ]
    },
    {
      title: "Reports",
      items: [
        { name: "Impact Reports", path: "/admin/reports", icon: FileSpreadsheet },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Audit Logs", path: "/admin/audit-logs", icon: ClipboardList },
        { name: "Settings", path: "/admin/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display text-white">RECYCLINK</h1>
            <p className="text-[10px] text-slate-400">Government Console</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/admin')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-extrabold text-lg text-white">RECYCLINK</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Government Console
                </p>
              </div>
            </div>
            <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item, iIdx) => {
                    const Icon = item.icon;
                    const isActive = item.exact 
                      ? location.pathname === item.path || location.pathname === item.path + '/dashboard'
                      : location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={iIdx}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Profile Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
                  CPCB
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-200 truncate">Dr. Sunita Sharma</div>
                  <div className="text-[10px] text-slate-400 truncate">Central Regulatory Desk</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  navigate('/');
                }} 
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>CPCB Sync Active</span>
              </span>
              <span className="text-amber-400 font-bold">DEMO MODE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Command Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              {systemStatus === "OPERATIONAL" ? (
                <span className="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>● SYSTEM OPERATIONAL</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>● DATA SYNC DELAYED</span>
                </span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                DEMO DATA — VERIFIED FOR SIH 2026
              </span>
            </div>
          </div>

          {/* Global Search & Filters */}
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-3">
            
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 text-xs transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Global Trace / Lot Search...</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 text-[9px] bg-slate-800 rounded border border-slate-700 text-slate-400">Ctrl+K</kbd>
            </button>

            {/* Date Range Selector */}
            {setSelectedPeriod && (
              <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 font-semibold outline-none cursor-pointer"
                >
                  <option value="Today" className="bg-slate-900 text-white">Today</option>
                  <option value="7 Days" className="bg-slate-900 text-white">7 Days</option>
                  <option value="30 Days" className="bg-slate-900 text-white">30 Days</option>
                  <option value="90 Days" className="bg-slate-900 text-white">90 Days</option>
                  <option value="All Time" className="bg-slate-900 text-white">All Time</option>
                  <option value="Custom" className="bg-slate-900 text-white">Custom Range...</option>
                </select>

                {selectedPeriod === "Custom" && (
                  <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-[10px]">
                    <input 
                      type="date" 
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-0.5 outline-none" 
                    />
                    <span className="text-slate-500">to</span>
                    <input 
                      type="date" 
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-0.5 outline-none" 
                    />
                  </div>
                )}
              </div>
            )}

            {/* City Filter */}
            {setSelectedCity && (
              <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Hubs (India)</option>
                  <option value="Hyderabad" className="bg-slate-900 text-white">Hyderabad (TS)</option>
                  <option value="Vijayawada" className="bg-slate-900 text-white">Vijayawada (AP)</option>
                  <option value="Guntur" className="bg-slate-900 text-white">Guntur (AP)</option>
                  <option value="Bapatla" className="bg-slate-900 text-white">Bapatla (AP)</option>
                  <option value="Bengaluru" className="bg-slate-900 text-white">Bengaluru (KA)</option>
                  <option value="Mumbai" className="bg-slate-900 text-white">Mumbai (MH)</option>
                  <option value="Pune" className="bg-slate-900 text-white">Pune (MH)</option>
                  <option value="Delhi" className="bg-slate-900 text-white">Delhi (NCR)</option>
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Child Views */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet context={{ selectedPeriod, setSelectedPeriod, selectedCity, setSelectedCity }} />
        </main>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Global Registry Search</h3>
              </div>
              <button 
                onClick={() => {
                  setSearchOpen(false);
                  setSearchResults(null);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Trace ID (RC-2026-...), Lot ID, Material, or Recycler..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Results Preview */}
            {searchResults && (
              <div className="max-h-80 overflow-y-auto space-y-3 pt-2">
                {searchResults.traces?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Trace Records ({searchResults.traces.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.traces.map((t, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/trace/${t.trace_id}`);
                          }}
                          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-400">{t.trace_id}</span>
                            <span className="text-xs text-slate-300 ml-2">{t.material} ({t.weight_kg} kg)</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.recyclers?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recyclers ({searchResults.recyclers.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.recyclers.map((r, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/admin/recyclers');
                          }}
                          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition"
                        >
                          <span className="text-xs font-bold text-white">{r.facility_name}</span>
                          <span className="text-xs text-slate-400">{r.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.traces?.length === 0 && searchResults.recyclers?.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No records found matching "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
