import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight,
  RefreshCw, Download, FileText, Search, Play, HelpCircle, Eye,
  Building2, Users, Layers, Activity, TrendingUp, TrendingDown,
  Sparkles, ShieldCheck, Scale, Compass, Check, X, Clock,
  ChevronRight, ArrowUpRight, BarChart3, Database
} from 'lucide-react';
import {
  getIntelligenceOverview, getIntelligenceTrends, getIntelligenceForecast,
  getIntelligenceBottlenecks, getIntelligenceRecommendations, actOnRecommendation,
  getIntelligenceDecisions, getIntelligenceOpportunities, getRecyclerNetworkCapacity,
  getAIPerformanceAnalytics, queryDecisionSupport, getIntelligenceTraceAlerts,
  resolveTraceAlert, runScenarioSimulation
} from '../../services/api';

export default function AdminIntelligenceCenter() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [trends, setTrends] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [recyclerNetwork, setRecyclerNetwork] = useState([]);
  const [aiPerformance, setAiPerformance] = useState(null);
  const [traceAlerts, setTraceAlerts] = useState([]);

  // Modals & User Actions
  const [selectedRecForEvidence, setSelectedRecForEvidence] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, rec: null, type: 'ACCEPT', notes: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // AI Decision Support Console State
  const [decisionQuery, setDecisionQuery] = useState('Why are PCB handovers delayed?');
  const [decisionSupportResult, setDecisionSupportResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Scenario Simulator State
  const [simType, setSimType] = useState('COLLECTOR_INCREASE');
  const [simPct, setSimPct] = useState(25);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        ovRes, recsRes, botRes, trRes, fcRes, decRes, oppRes, recNetRes, aiRes, alertRes
      ] = await Promise.all([
        getIntelligenceOverview().catch(() => null),
        getIntelligenceRecommendations().catch(() => []),
        getIntelligenceBottlenecks().catch(() => []),
        getIntelligenceTrends().catch(() => []),
        getIntelligenceForecast().catch(() => []),
        getIntelligenceDecisions().catch(() => []),
        getIntelligenceOpportunities().catch(() => []),
        getRecyclerNetworkCapacity().catch(() => []),
        getAIPerformanceAnalytics().catch(() => null),
        getIntelligenceTraceAlerts().catch(() => [])
      ]);

      setOverview(ovRes);
      setRecommendations(recsRes || []);
      setBottlenecks(botRes || []);
      setTrends(trRes || []);
      setForecasts(fcRes || []);
      setDecisions(decRes || []);
      setOpportunities(oppRes || []);
      setRecyclerNetwork(recNetRes || []);
      setAiPerformance(aiRes);
      setTraceAlerts(alertRes || []);
    } catch (err) {
      console.error('Error fetching intelligence center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenActionModal = (rec, type) => {
    setActionModal({
      open: true,
      rec,
      type,
      notes: type === 'ACCEPT' ? 'Approved based on verified CPCB capacity evidence.' : 'Dismissed after operational review.'
    });
  };

  const handleExecuteAction = async () => {
    if (!actionModal.rec) return;
    setSubmittingAction(true);
    try {
      await actOnRecommendation(actionModal.rec.id, {
        action: actionModal.type,
        admin_notes: actionModal.notes
      });
      setActionSuccessMsg(`Successfully executed action for ${actionModal.rec.recommendation_code}`);
      setActionModal({ open: false, rec: null, type: 'ACCEPT', notes: '' });
      await fetchAllData();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      alert(`Action failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRunDecisionQuery = async (queryText = decisionQuery) => {
    if (!queryText.trim()) return;
    setQueryLoading(true);
    try {
      const res = await queryDecisionSupport(queryText);
      setDecisionSupportResult(res);
    } catch (err) {
      console.error('Error querying decision support:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await runScenarioSimulation(simType, simPct);
      setSimResult(res);
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveTraceAlert(alertId, { action: 'RESOLVE', notes: 'Manually verified via admin console' });
      await fetchAllData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/intelligence/export', '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-slate-300 font-medium tracking-wide">Synthesizing platform telemetry & network intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto text-slate-100">

      {/* Top Banner / Environment Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/30">
              <BrainCircuit className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold font-display tracking-tight text-white">
                  Circular Economy Intelligence Center
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Phase 11 Autonomous
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  DEMO ENVIRONMENT
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Predictive material flows, deterministic bottleneck detection, and human-supervised recommendation dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAllData}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit (CSV)</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-200 font-medium">{actionSuccessMsg}</p>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 10-KPI Operational Command Scorecard */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Tracked E-Waste</span>
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.e_waste_tracked_kg} <span className="text-xs text-slate-400 font-normal">kg</span></div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">Verified Platform Inflow</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Traceable Lots</span>
              <Layers className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.traceable_lots_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Digital Passports Active</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Capacity Pressure</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-display text-amber-400">{overview.capacity_pressure_count}</div>
            <div className="text-[11px] text-amber-300/80 font-medium mt-1">Recycler Intake Saturation</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Pending Pickups</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.pending_pickups_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Awaiting Vehicle Consolidation</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Recommendations</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-display text-purple-400">{overview.open_recommendations_count}</div>
            <div className="text-[11px] text-purple-300 font-medium mt-1">Awaiting Human Approval</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Formal Handovers</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.formal_handovers_count}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">Dual-OTP Verified Consignments</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Collectors</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.active_collectors_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Informal PWA Users</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Verified Recyclers</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.active_recyclers_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">CPCB Licensed Facilities</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Trace Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-display text-rose-400">{overview.trace_alerts_count}</div>
            <div className="text-[11px] text-rose-300/80 font-medium mt-1">Stalled Stages &gt; 24h</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Anomalies</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white">{overview.active_anomalies_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Price &amp; Weight Checks</div>
          </div>
        </div>
      )}

      {/* Today's Intelligence Timeline & Top Prioritized Actions */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Prioritized Operational Actions</span>
            </h2>
            <div className="space-y-2.5">
              {overview.top_actions.map((act, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-200 leading-snug">{act}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Today&apos;s System Intelligence</span>
            </h2>
            <div className="space-y-3">
              {overview.system_intelligence_timeline.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs">
                  <span className="font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
                    {item.time}
                  </span>
                  <span className={`flex-1 ${item.level === 'WARNING' ? 'text-amber-300' : 'text-slate-300'}`}>
                    {item.event}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800 text-sm">
        {[
          { id: 'recommendations', label: 'Action Center & Recommendations', icon: Sparkles, count: recommendations.filter(r => r.status === 'GENERATED' || r.status === 'REVIEWED').length },
          { id: 'bottlenecks', label: 'Network Bottlenecks', icon: AlertTriangle, count: bottlenecks.length },
          { id: 'forecasts', label: 'Predictive Demand Forecast', icon: TrendingUp },
          { id: 'decision_support', label: 'AI Decision Support Console', icon: BrainCircuit },
          { id: 'opportunities', label: 'Circular Opportunities', icon: Compass, count: opportunities.length },
          { id: 'recycler_network', label: 'Recycler Capacity View', icon: Building2 },
          { id: 'ai_performance', label: 'AI Correction Analytics', icon: BarChart3 },
          { id: 'trace_alerts', label: 'Traceability Alerts', icon: ShieldAlert, count: traceAlerts.filter(a => a.status === 'OPEN').length },
          { id: 'decisions', label: 'Decision Audit History', icon: Database, count: decisions.length },
          { id: 'simulator', label: 'Scenario Simulator 2.0', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RECOMMENDATIONS & HUMAN-IN-THE-LOOP ACTION CENTER */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-white">
                Human-Approved Autonomous Recommendations
              </h2>
              <p className="text-xs text-slate-400">
                AI proposes load-balancing and batching based on deterministic rules. Consequential execution requires authorized administrator approval.
              </p>
            </div>
            <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              STATE: GENERATED → REVIEWED → ACCEPTED / DISMISSED → EXECUTED → VERIFIED
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {recommendations.map((rec) => {
              const isPending = rec.status === 'GENERATED' || rec.status === 'REVIEWED';
              return (
                <div
                  key={rec.id}
                  className={`p-6 rounded-2xl border transition ${
                    isPending
                      ? 'bg-slate-900/90 border-slate-700/80 shadow-lg shadow-black/40'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {rec.recommendation_code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        rec.priority === 'CRITICAL' || rec.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                        {rec.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        rec.status === 'EXECUTED' || rec.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : (rec.status === 'DISMISSED' ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/20 text-blue-300')
                      }`}>
                        {rec.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Generated: {new Date(rec.created_at).toLocaleDateString()} at {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{rec.title}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block mb-1">Reason / Trigger</span>
                      <p className="text-slate-200 font-medium">{rec.reason}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block mb-1">Expected Outcome</span>
                      <p className="text-emerald-300 font-medium">{rec.expected_effect}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block mb-1">Impacted Scope</span>
                      <p className="text-slate-200 font-medium">
                        {rec.affected_lots_count} lots • {rec.affected_weight_kg} kg • {rec.material || 'Mixed E-Waste'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400">Recommended Action:</span>
                      <span className="text-slate-100 font-semibold">{rec.recommended_action}</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => setSelectedRecForEvidence(rec)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Evidence</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleOpenActionModal(rec, 'ACCEPT')}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept &amp; Execute</span>
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(rec, 'DISMISS')}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NETWORK BOTTLENECK ENGINE */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Operational Network Bottleneck Engine</h2>
            <p className="text-xs text-slate-400">
              Deterministic detection of supply vs capacity pressures, logistics transit queues, and regional onboarding gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bottlenecks.map((bot, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {bot.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      bot.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {bot.priority} Priority
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Material: <span className="text-white">{bot.material || 'Mixed'}</span> • Scope: {bot.affected_lots} lots ({bot.pending_weight_kg} kg)
                  </div>

                  <div className="space-y-3 my-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-0.5">WHAT HAPPENED?</span>
                      <p className="text-slate-200">{bot.what_happened}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-0.5">WHY?</span>
                      <p className="text-slate-200">{bot.why}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-0.5">WHO / WHAT IS AFFECTED?</span>
                      <p className="text-slate-200">{bot.affected_entities}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs">
                  <span className="text-emerald-400 font-bold block mb-1">WHAT CAN BE DONE?</span>
                  <p className="text-slate-200">{bot.what_can_be_done}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PREDICTIVE TRENDS & MATERIAL DEMAND FORECAST */}
      {activeTab === 'forecasts' && (
        <div className="space-y-8">
          {/* Trends Section */}
          <div>
            <h2 className="text-lg font-bold font-display text-white mb-1">Bi-Weekly Platform Trends</h2>
            <p className="text-xs text-slate-400 mb-4">
              Configured deterministic calculations comparing two consecutive 14-day rolling windows.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trends.map((tr, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block mb-1">{tr.metric}</span>
                  <div className="flex items-center space-x-2 my-1">
                    <span className="text-2xl font-bold font-display text-white">{tr.current_period_val}</span>
                    <span className="text-xs text-slate-400">{tr.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-semibold">
                    {tr.trend_direction === 'Increasing' ? (
                      <span className="flex items-center text-emerald-400"><TrendingUp className="w-3.5 h-3.5 mr-1" /> +{tr.change_pct}%</span>
                    ) : tr.trend_direction === 'Decreasing' ? (
                      <span className="flex items-center text-rose-400"><TrendingDown className="w-3.5 h-3.5 mr-1" /> {tr.change_pct}%</span>
                    ) : (
                      <span className="text-slate-400">Stable ({tr.change_pct}%)</span>
                    )}
                    <span className="text-[11px] text-slate-500">vs prev 14d</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">{tr.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Material Demand Forecast */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-display text-white">Material Demand Forecast</h2>
                <p className="text-xs text-slate-400">
                  Projected material demand for next cycle. Clearly tagged as <span className="text-amber-400 font-bold">ESTIMATE</span> with grounded explainability.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((fc, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{fc.material}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {fc.estimate_label}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-3 my-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Current Intake</span>
                        <span className="text-lg font-bold text-slate-300">{fc.current_kg} kg</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <div>
                        <span className="text-[11px] text-slate-400 block">Expected Next Period</span>
                        <span className="text-xl font-bold text-emerald-400">~{fc.expected_next_period_kg} kg</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs mb-3">
                      <span className="text-slate-400">Model Confidence:</span>
                      <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-200 font-bold text-[10px]">
                        {Math.round(fc.confidence_score * 100)}% ({fc.confidence_label})
                      </span>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2.5">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">WHY THIS FORECAST?</span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {fc.why_this_forecast.map((why, wIdx) => (
                          <li key={wIdx} className="flex items-start space-x-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{why}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI DECISION SUPPORT CONSOLE */}
      {activeTab === 'decision_support' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">AI Decision Support Console</h2>
            <p className="text-xs text-slate-400">
              Not a chatbot. Queries are resolved via: <span className="text-emerald-400">Intent Detection → Authorized DB Retrieval → Deterministic Analysis → Explainable Action</span>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Example Operational Inquiries</span>
            <div className="flex flex-wrap gap-2">
              {[
                "Why are PCB handovers delayed?",
                "Which recyclers are at capacity?",
                "Where is the formalization gap?",
                "How can we optimize pickup routes?"
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDecisionQuery(query);
                    handleRunDecisionQuery(query);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
                >
                  &ldquo;{query}&rdquo;
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="text"
                value={decisionQuery}
                onChange={(e) => setDecisionQuery(e.target.value)}
                placeholder="Ask an operational query grounded in platform data..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleRunDecisionQuery()}
                disabled={queryLoading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition shadow-md shadow-emerald-600/20"
              >
                {queryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Analyze Evidence</span>
              </button>
            </div>
          </div>

          {/* Decision Support Result Card */}
          {decisionSupportResult && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    INTENT: {decisionSupportResult.intent}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({decisionSupportResult.relevant_records_count} DB records analyzed)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Records: {decisionSupportResult.records_used.join(', ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold block mb-1">CALCULATED GROUND TRUTH INDICATORS</span>
                  <div className="space-y-1 font-mono text-slate-200 mt-2">
                    {Object.entries(decisionSupportResult.calculated_indicators).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-slate-900 py-1">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-emerald-400 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold block mb-1">EVIDENCE SYNTHESIS</span>
                  <p className="text-slate-300 leading-relaxed mt-2">{decisionSupportResult.evidence_text}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold block mb-1">WHY THIS HAPPENED (ROOT CAUSE)</span>
                <p className="text-slate-200 leading-relaxed mt-1">{decisionSupportResult.explanation}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-400 font-bold block mb-1">RECOMMENDED OPERATIONAL ACTION</span>
                  <p className="text-slate-100 font-medium">{decisionSupportResult.suggested_action}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CIRCULAR OPPORTUNITIES & FORMALIZATION GAPS */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Circular Economy Opportunity Detector</h2>
            <p className="text-xs text-slate-400">
              Detects systemic leverage points: high-collection areas with low formalization, underutilized recyclers, and safety intervention hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {opp.id} • {opp.opportunity_type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {opp.gap_status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{opp.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">{opp.region_or_material}</p>

                  <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Collection Activity</span>
                      <span className="text-slate-200 font-semibold">{opp.collection_activity}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Formal Handover</span>
                      <span className="text-slate-200 font-semibold">{opp.formal_handover_activity}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-2 mb-4">
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">RECOMMENDED INVESTIGATION</span>
                      <p className="text-slate-200">{opp.recommended_investigation}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                  <span className="text-emerald-400 font-bold block mb-0.5">ESTIMATED CIRCULAR IMPACT</span>
                  <p className="text-slate-200">{opp.estimated_impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RECYCLER NETWORK CAPACITY VIEW */}
      {activeTab === 'recycler_network' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Recycler Network Capacity View</h2>
            <p className="text-xs text-slate-400">
              Real-time authorized facility workload, configured throughput, available headroom, and pressure level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recyclerNetwork.map((rec) => (
              <div key={rec.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.pressure_level === 'PRESSURE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {rec.pressure_level}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{rec.city}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{rec.facility_name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono block mb-3">{rec.authorization_status}</span>

                  <div className="space-y-2 text-xs my-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Configured Monthly Capacity:</span>
                      <span className="text-slate-200 font-bold">{rec.configured_capacity_kg_month} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Used Capacity:</span>
                      <span className="text-slate-200 font-bold">{rec.used_capacity_kg_month} kg ({rec.utilization_pct}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Headroom:</span>
                      <span className="text-emerald-400 font-bold">{rec.available_capacity_kg_month} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pending Assigned Lots:</span>
                      <span className="text-slate-200 font-bold">{rec.pending_lots_assigned} lots</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rec.utilization_pct > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(rec.utilization_pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Specialties: {rec.material_specialties.join(', ')}</span>
                  <span>{rec.pickup_capable ? '✓ Fleet Dispatch' : 'Intake Depot'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: AI CORRECTION ANALYTICS */}
      {activeTab === 'ai_performance' && aiPerformance && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">AI Model Performance &amp; Human Correction Analytics</h2>
            <p className="text-xs text-slate-400">
              Derived from <span className="font-mono text-emerald-400">ai_feedback</span> telemetry. Tracks human overrides, low-confidence classifications, and material confusion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total AI Classifications</span>
              <div className="text-2xl font-bold font-display text-white my-1">{aiPerformance.total_ai_classifications}</div>
              <span className="text-[11px] text-slate-500">Platform Camera Vision Inflow</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Human Corrections</span>
              <div className="text-2xl font-bold font-display text-amber-400 my-1">{aiPerformance.human_corrections_count}</div>
              <span className="text-[11px] text-slate-500">Collector / Recycler Adjustments</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Correction Rate</span>
              <div className="text-2xl font-bold font-display text-white my-1">{aiPerformance.correction_rate_pct}%</div>
              <span className="text-[11px] text-emerald-400">Calibrated Operational Band</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Low-Confidence Triggers</span>
              <div className="text-2xl font-bold font-display text-sky-400 my-1">{aiPerformance.low_confidence_count}</div>
              <span className="text-[11px] text-slate-500">Dispatched to Human Confirmation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Most Frequently Confused Materials</h3>
              <div className="space-y-3">
                {aiPerformance.most_confused_materials.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">AI Predicted: </span>
                      <span className="text-rose-400 font-semibold">{item.ai_predicted}</span>
                      <ArrowRight className="w-3 h-3 inline mx-2 text-slate-600" />
                      <span className="text-slate-400">Human Corrected: </span>
                      <span className="text-emerald-400 font-semibold">{item.human_corrected}</span>
                    </div>
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {item.occurrences}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Recent Collector Feedback Submissions</h3>
              <div className="space-y-3">
                {aiPerformance.recent_feedbacks.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 font-medium">{f.original} → {f.corrected}</span>
                      <span className="text-[11px] text-slate-500 block">Confidence: {f.confidence} • {f.created_at}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      LOGGED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: TRACEABILITY ALERTS & DELAYS */}
      {activeTab === 'trace_alerts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Traceability Delays &amp; SLA Alerts</h2>
            <p className="text-xs text-slate-400">
              Proactive detection of consignments stalled at intermediate stages (pickup delay, pending OTP handover, unverified telemetry).
            </p>
          </div>

          <div className="space-y-3">
            {traceAlerts.map((alt) => (
              <div key={alt.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      {alt.trace_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
                      STAGE: {alt.current_stage}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      alt.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {alt.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      alt.status === 'OPEN' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {alt.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-1">{alt.description}</p>
                  <p className="text-xs text-emerald-300 font-medium">Action: {alt.recommended_action}</p>
                </div>

                {alt.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolveAlert(alt.id)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-bold text-slate-200 border border-slate-700 transition"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: DECISION HISTORY & CLOSED-LOOP AUDIT LEDGER */}
      {activeTab === 'decisions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Closed-Loop Decision Audit History</h2>
            <p className="text-xs text-slate-400">
              Immutable ledger of human-in-the-loop decisions, execution results, and verified outcomes.
            </p>
          </div>

          <div className="space-y-3">
            {decisions.map((dec) => (
              <div key={dec.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      {dec.recommendation_code}
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400">
                      {dec.decision}
                    </span>
                    <span className="text-slate-400">by {dec.admin_name}</span>
                  </div>
                  <span className="text-slate-500">
                    {new Date(dec.decision_time).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm font-semibold text-white my-2">{dec.action_taken}</div>

                {dec.outcome_notes && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mt-2 text-slate-300">
                    <span className="text-slate-500 block mb-0.5 font-bold uppercase tracking-wider text-[10px]">Verified Outcome</span>
                    {dec.outcome_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: SCENARIO SIMULATOR 2.0 */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">Scenario Simulator 2.0</h2>
            <p className="text-xs text-slate-400">
              Counterfactual stress-testing of circular economy capacity. <span className="text-amber-400 font-bold">SIMULATION - NOT ACTUAL DATA</span>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Scenario Template</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
              >
                <option value="COLLECTOR_INCREASE">Collector Participation Surge (+X%)</option>
                <option value="RECYCLER_CAPACITY_DROP">Primary Recycler Maintenance Outage (-X%)</option>
                <option value="SUPPLY_SURGE">E-Waste Seasonal Intake Surge (+X%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Parameter Shift: {simPct}%</label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={simPct}
                onChange={(e) => setSimPct(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition shadow-md shadow-emerald-600/20"
            >
              {simLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Simulate Counterfactual</span>
            </button>
          </div>

          {simResult && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">{simResult.scenario_name}</h3>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {simResult.simulation_label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-2 uppercase">CURRENT BASELINE</span>
                  <div className="space-y-1 font-mono">
                    {Object.entries(simResult.current_baseline).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block mb-2 uppercase">SIMULATED RESULT</span>
                  <div className="space-y-1 font-mono">
                    {Object.entries(simResult.simulated_result).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-emerald-300 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold block mb-1">COUNTERFACTUAL DIFFERENCE</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {Object.entries(simResult.counterfactual_difference).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">{k}</span>
                      <span className="text-emerald-400 font-bold text-xs">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-400 font-bold block mb-0.5">ACTIONABLE TAKEAWAY</span>
                  <p className="text-slate-200">{simResult.actionable_takeaway}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EVIDENCE PANEL MODAL */}
      {selectedRecForEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-400">{selectedRecForEvidence.recommendation_code}</span>
                <h3 className="text-lg font-bold text-white">{selectedRecForEvidence.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecForEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRecForEvidence.evidence && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">RECORDS USED</span>
                  <div className="flex flex-wrap gap-1.5 mt-1 font-mono">
                    {selectedRecForEvidence.evidence.records_used?.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {r}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-500 text-[11px] block mt-2">
                    Historical Time Window: {selectedRecForEvidence.evidence.time_range}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">DETERMINISTIC CALCULATION / RULE</span>
                  <p className="font-mono text-emerald-400 mt-1">{selectedRecForEvidence.evidence.calculation_rule}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-2">WHY THIS SPECIFIC ACTION?</span>
                  <ul className="space-y-1.5 text-slate-200">
                    {selectedRecForEvidence.evidence.why_this_action?.map((why, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{why}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedRecForEvidence.counterfactual && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-2 uppercase">Counterfactual Comparison</span>
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">CURRENT SYSTEM</span>
                        {Object.entries(selectedRecForEvidence.counterfactual.current_system || {}).map(([k, v]) => (
                          <div key={k} className="text-slate-300 py-0.5">{k}: <span className="font-bold text-white">{String(v)}</span></div>
                        ))}
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-emerald-500/30">
                        <span className="text-emerald-400 block text-[10px]">SIMULATED SYSTEM</span>
                        {Object.entries(selectedRecForEvidence.counterfactual.simulated_system || {}).map(([k, v]) => (
                          <div key={k} className="text-slate-300 py-0.5">{k}: <span className="font-bold text-emerald-300">{String(v)}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedRecForEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Close Evidence Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN APPROVAL SAFETY MODAL */}
      {actionModal.open && actionModal.rec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center space-x-3">
              {actionModal.type === 'ACCEPT' ? (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-white">
                  {actionModal.type === 'ACCEPT' ? 'Confirm Consequential Operational Action' : 'Dismiss Recommendation'}
                </h3>
                <p className="text-xs text-slate-400">
                  {actionModal.rec.recommendation_code}: {actionModal.rec.title}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400 block mb-1 font-bold">PROPOSED ACTION:</span>
              <p className="font-medium text-white">{actionModal.rec.recommended_action}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Administrator Audit Notes
              </label>
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="Enter authorized justification for decision audit ledger..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActionModal({ open: false, rec: null, type: 'ACCEPT', notes: '' })}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={submittingAction}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  actionModal.type === 'ACCEPT'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submittingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{actionModal.type === 'ACCEPT' ? 'Confirm & Execute Action' : 'Confirm Dismissal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
