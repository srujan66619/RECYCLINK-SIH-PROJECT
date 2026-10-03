import React, { useState, useEffect } from 'react';
import { 
  Network, ShieldCheck, Scale, Award, Building2, Sliders, 
  Layers, CheckCircle2, AlertTriangle, RefreshCw, FileText, 
  RotateCcw, Eye, ArrowRight, UserCheck, ShieldAlert, Zap, 
  TrendingUp, Database, Activity, Sparkles, HelpCircle, Check, X
} from 'lucide-react';
import {
  getCircularNetworkGraph, getNetworkHealth, getParticipantTrustProfiles,
  getDisputes, getDispute, createDispute, resolveDispute,
  getIncentives, getAntiGamingAudit, getInstitutionalPartners,
  createInstitutionalPartner, verifyInstitutionalPartner,
  runMultiPolicySimulation, getMaterialFlow, getDataQuality,
  getSystemHealth, getPolicyRules, updatePolicyRule,
  getPolicyVersions, rollbackPolicyRule, getOperationalIncidents,
  getInstitutionalReport
} from '../../services/api';

export default function AdminNetworkOrchestrationView() {
  const [activeTab, setActiveTab] = useState('network');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [networkGraph, setNetworkGraph] = useState(null);
  const [networkHealth, setNetworkHealth] = useState(null);
  const [trustProfiles, setTrustProfiles] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [incentives, setIncentives] = useState([]);
  const [antiGaming, setAntiGaming] = useState(null);
  const [partners, setPartners] = useState([]);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [materialFlow, setMaterialFlow] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [policyRules, setPolicyRules] = useState([]);
  const [selectedPolicyVersions, setSelectedPolicyVersions] = useState(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [institutionalReport, setInstitutionalReport] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  // Policy Simulation state
  const [simParams, setSimParams] = useState({
    collector_surge_pct: 25.0,
    recycler_capacity_delta_pct: 15.0,
    pickup_fleet_delta_pct: 20.0,
    campaign_intensity_pct: 30.0,
    incentive_multiplier: 1.25
  });
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Resolution Form
  const [resolutionAction, setResolutionAction] = useState('RESOLVE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Partner Form
  const [newPartner, setNewPartner] = useState({
    name: '',
    partner_type: 'MUNICIPALITY',
    service_area: '',
    city: 'Hyderabad',
    state: 'Telangana',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    material_capabilities: 'PCB, Batteries, Cables, IT Hardware'
  });

  // Policy Update Form
  const [policyUpdateKey, setPolicyUpdateKey] = useState('');
  const [policyNewVal, setPolicyNewVal] = useState('');
  const [policyReason, setPolicyReason] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        graphRes, healthRes, trustRes, disputesRes,
        incRes, gamingRes, partRes, flowRes,
        dqRes, sysRes, polRes, opsRes
      ] = await Promise.all([
        getCircularNetworkGraph().catch(() => null),
        getNetworkHealth().catch(() => null),
        getParticipantTrustProfiles().catch(() => []),
        getDisputes().catch(() => []),
        getIncentives().catch(() => []),
        getAntiGamingAudit().catch(() => null),
        getInstitutionalPartners().catch(() => []),
        getMaterialFlow().catch(() => null),
        getDataQuality().catch(() => null),
        getSystemHealth().catch(() => null),
        getPolicyRules().catch(() => []),
        getOperationalIncidents().catch(() => [])
      ]);

      setNetworkGraph(graphRes);
      setNetworkHealth(healthRes);
      setTrustProfiles(trustRes || []);
      setDisputes(disputesRes || []);
      setIncentives(incRes || []);
      setAntiGaming(gamingRes);
      setPartners(partRes || []);
      setMaterialFlow(flowRes);
      setDataQuality(dqRes);
      setSystemHealth(sysRes);
      setPolicyRules(polRes || []);
      setIncidents(opsRes || []);
    } catch (err) {
      console.error("Error loading orchestration data:", err);
      setError("Failed to load circular orchestration telemetry. Check backend service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const res = await runMultiPolicySimulation(simParams);
      setSimResult(res);
      showToast("Multi-Policy Simulation completed successfully.");
    } catch (err) {
      console.error(err);
      showToast("Simulation failed to calculate.");
    } finally {
      setSimulating(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setSubmittingResolution(true);
    try {
      await resolveDispute(selectedDispute.id, {
        action: resolutionAction,
        resolution_notes: resolutionNotes || "Resolved after impartial evidence review."
      });
      showToast(`Dispute ${selectedDispute.dispute_code} successfully updated.`);
      setDisputeModalOpen(false);
      const updated = await getDisputes();
      setDisputes(updated);
    } catch (err) {
      console.error(err);
      showToast("Failed to resolve dispute.");
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      await createInstitutionalPartner(newPartner);
      showToast(`Partner application for ${newPartner.name} submitted.`);
      setPartnerModalOpen(false);
      setNewPartner({
        name: '',
        partner_type: 'MUNICIPALITY',
        service_area: '',
        city: 'Hyderabad',
        state: 'Telangana',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        material_capabilities: 'PCB, Batteries, Cables, IT Hardware'
      });
      const parts = await getInstitutionalPartners();
      setPartners(parts);
    } catch (err) {
      console.error(err);
      showToast("Failed to register partner.");
    }
  };

  const handleVerifyPartner = async (partnerId, status) => {
    try {
      await verifyInstitutionalPartner(partnerId, {
        status: status,
        notes: `Partner status moved to ${status} via Institutional Readiness Console.`
      });
      showToast(`Partner ${status === 'ACTIVE' ? 'Activated' : 'Updated'}.`);
      const parts = await getInstitutionalPartners();
      setPartners(parts);
    } catch (err) {
      console.error(err);
      showToast("Failed to verify partner.");
    }
  };

  const handleViewPolicyVersions = async (key) => {
    try {
      const versions = await getPolicyVersions(key);
      setSelectedPolicyVersions({ key, versions });
      setVersionModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast("Could not retrieve version history.");
    }
  };

  const handleRollbackPolicy = async (key, targetVersion) => {
    try {
      await rollbackPolicyRule({
        policy_key: key,
        target_version: targetVersion,
        reason: "Administrative rollback from version history console."
      });
      showToast(`Policy '${key}' successfully rolled back to v${targetVersion}.`);
      setVersionModalOpen(false);
      const rules = await getPolicyRules();
      setPolicyRules(rules);
    } catch (err) {
      console.error(err);
      showToast("Rollback failed.");
    }
  };

  const handleOpenReport = async () => {
    try {
      const rep = await getInstitutionalReport();
      setInstitutionalReport(rep);
      setReportModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to generate report.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Phase 12 Enterprise Engine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SIH26229 Kabadiwala Connect
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight">
              Circular Economy Network Orchestration & Trust Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Multi-participant coordination, transparent trust profile governance, evidence-grounded dispute resolution, 
              institutional onboarding, and multi-scenario policy simulation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {networkHealth && (
              <button 
                onClick={() => setHealthModalOpen(true)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-4 py-3 rounded-xl flex items-center space-x-3 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                  <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    Network Health <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-lg font-bold text-emerald-400 leading-tight">
                    {networkHealth.overall_score} / 100 
                    <span className="text-xs font-normal text-slate-300 ml-1.5">({networkHealth.health_tier})</span>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleOpenReport}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-900/30 transition-all text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>CPCB Formal Report</span>
            </button>

            <button
              onClick={loadAllData}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800 scrollbar-thin">
        {[
          { id: 'network', label: 'Network Graph', icon: Network },
          { id: 'trust', label: 'Trust Profiles', icon: ShieldCheck },
          { id: 'disputes', label: 'Dispute Center', icon: Scale, badge: disputes.filter(d => d.status === 'DISPUTE_CREATED').length },
          { id: 'incentives', label: 'Incentives & Anti-Gaming', icon: Award },
          { id: 'partners', label: 'Institutional Partners', icon: Building2, badge: partners.filter(p => p.verification_status === 'APPLICATION').length },
          { id: 'policy', label: 'Policy Simulator', icon: Sliders },
          { id: 'materialFlow', label: 'Material Flow & Gaps', icon: Layers },
          { id: 'dataQuality', label: 'Data Quality', icon: Database },
          { id: 'governance', label: 'Policy Rules & Rollback', icon: RotateCcw },
          { id: 'incidents', label: 'Incidents & Playbooks', icon: ShieldAlert, badge: incidents.filter(i => i.status !== 'RESOLVED').length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CIRCULAR NETWORK GRAPH */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Total Network Nodes</span>
              <p className="text-2xl font-extrabold text-white mt-1">{networkGraph?.summary?.total_nodes || 0}</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Verified Edge Links</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{networkGraph?.summary?.total_edges || 0}</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Informal Collectors</span>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">{networkGraph?.summary?.collector_nodes || 0}</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Authorized Recyclers</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{networkGraph?.summary?.recycler_nodes || 0}</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Partner Institutions</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{networkGraph?.summary?.institution_nodes || 0}</p>
            </div>
          </div>

          {/* Interactive Topology Visualizer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-400" />
                  Ecosystem Topology & Provenance Chain
                </h3>
                <p className="text-xs text-slate-400">
                  Maps actual application entities: Collector → Collection Lot → Material → Pickup Dispatch → Recycler Depot → Verified Downstream Processing.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Ground-Truth Relational Graph (Zero Fake Blockchains)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="font-bold text-cyan-400 block mb-1">Upstream Collection Layer</span>
                Informal Kabadiwalas aggregate fragmented consumer and MSME e-waste into barcoded lots.
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="font-bold text-indigo-400 block mb-1">Midstream Logistics & Gate</span>
                Dual-OTP verified handovers and weighbridge tare validation prevent clandestine diversion.
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="font-bold text-emerald-400 block mb-1">Downstream Certified Processing</span>
                Only authorized recyclers with active CPCB authorization log dismantling and precious metal recovery.
              </div>
            </div>

            {/* Nodes list preview */}
            <div className="overflow-x-auto max-h-96 border border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Node ID</th>
                    <th className="p-3">Entity Label</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Weight / Capacity</th>
                    <th className="p-3">Provenance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {networkGraph?.nodes?.slice(0, 15).map(node => (
                    <tr key={node.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{node.id}</td>
                      <td className="p-3 font-medium text-white">{node.label}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          node.type === 'COLLECTOR' ? 'bg-cyan-500/20 text-cyan-300' :
                          node.type === 'RECYCLER' ? 'bg-indigo-500/20 text-indigo-300' :
                          node.type === 'LOT' ? 'bg-amber-500/20 text-amber-300' :
                          node.type === 'INSTITUTION' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {node.type}
                        </span>
                      </td>
                      <td className="p-3">{node.weight_kg ? `${node.weight_kg} kg` : '—'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {node.status || 'VERIFIED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRUST PROFILES */}
      {activeTab === 'trust' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Non-Discriminatory Trust Profile Governance
              </h3>
              <p className="text-xs text-slate-400">
                Scores derived solely from completed handovers, traceability compliance, and zero dispute penalties. Zero demographic scoring.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
              CPCB Fair Governance Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustProfiles.map(profile => (
              <div key={profile.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {profile.role}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      profile.trust_tier === 'EXEMPLARY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      profile.trust_tier === 'ESTABLISHED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {profile.trust_tier}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1">{profile.user_name}</h4>
                  <div className="text-3xl font-extrabold text-emerald-400 mb-4">
                    {profile.trust_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed Transactions:</span>
                      <span className="font-semibold text-white">{profile.completed_transactions_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Traceability Completeness:</span>
                      <span className="font-semibold text-emerald-400">{profile.traceability_completeness_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Successful Handovers:</span>
                      <span className="font-semibold text-white">{profile.successful_handovers_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cancellation Rate:</span>
                      <span className="font-semibold text-cyan-400">{profile.cancellation_rate_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dispute Count:</span>
                      <span className={`font-semibold ${profile.dispute_count > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {profile.dispute_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Transparent Drivers</span>
                  <div className="space-y-1">
                    {profile.breakdown?.positive_factors?.slice(0, 2).map((factor, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{factor}</span>
                      </div>
                    ))}
                    {profile.breakdown?.caution_factors?.slice(0, 1).map((factor, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 text-xs text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTE CENTER */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Evidence-Grounded Dispute Center
              </h3>
              <p className="text-xs text-slate-400">
                Impartial AI evidence analysis for tare weighbridge discrepancies. Final judgment is strictly reserved for authorized human administrators.
              </p>
            </div>
            <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              {disputes.filter(d => d.status === 'DISPUTE_CREATED').length} Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disputes.map(dispute => (
              <div key={dispute.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">{dispute.dispute_code}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      dispute.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      dispute.status === 'DISMISSED' ? 'bg-slate-800 text-slate-400' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{dispute.title}</h4>
                  <p className="text-xs text-slate-300 mb-3">{dispute.claim_description}</p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Claimant:</span>
                      <span className="font-semibold text-white">{dispute.raised_by_name} ({dispute.raised_by_role})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dispute Type:</span>
                      <span className="font-semibold text-amber-400">{dispute.dispute_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trace ID:</span>
                      <span className="font-mono text-cyan-400">{dispute.trace_id || 'TRC-LINKED'}</span>
                    </div>
                    {dispute.claimed_value && dispute.recorded_value && (
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Variance:</span>
                        <span className="font-mono text-rose-400 font-bold">
                          {dispute.claimed_value} claimed vs {dispute.recorded_value} recorded (Δ {Math.abs(dispute.claimed_value - dispute.recorded_value).toFixed(1)} kg)
                        </span>
                      </div>
                    )}
                  </div>

                  {dispute.ai_dispute_summary && (
                    <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-xl mb-3 text-xs">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Objective AI Telemetry Summary (Non-Judgmental)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{dispute.ai_dispute_summary}</p>
                    </div>
                  )}

                  {dispute.resolution_notes && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl text-xs text-slate-300">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Resolution by {dispute.resolved_by_admin_name || 'Admin'}
                      </span>
                      <p>{dispute.resolution_notes}</p>
                    </div>
                  )}
                </div>

                {dispute.status === 'DISPUTE_CREATED' && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setDisputeModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Inspect Evidence & Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INCENTIVES & ANTI-GAMING */}
      {activeTab === 'incentives' && (
        <div className="space-y-6">
          {antiGaming && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Anti-Gaming Telemetry Audit</h3>
                    <p className="text-xs text-slate-400">Protects incentive budget against artificial lot splitting and duplicate rewards.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Status: {antiGaming.anti_gaming_status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Artificial Splitting Flags:</span>
                  <p className="text-lg font-bold text-cyan-400 mt-1">{antiGaming.artificial_splitting_flags}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Duplicate Reward Attempts:</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{antiGaming.duplicate_reward_attempts}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Integrity Confidence:</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{antiGaming.integrity_confidence_pct}%</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Audit Scope:</span>
                  <p className="text-lg font-bold text-white mt-1">{antiGaming.audit_period}</p>
                </div>
              </div>

              <div className="space-y-1">
                {antiGaming.safeguards_active?.map((safe, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{safe}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Verified Incentive Allocations (Points, Badges, Recognition)
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Incentive Code</th>
                    <th className="p-3">Beneficiary</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Reward Title</th>
                    <th className="p-3">Points / Badge</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Why Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {incentives.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-cyan-400">{inc.incentive_code}</td>
                      <td className="p-3 font-medium text-white">{inc.user_name} ({inc.user_role})</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {inc.incentive_type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{inc.title}</td>
                      <td className="p-3 font-bold text-emerald-400">
                        {inc.badge_name ? `🏅 ${inc.badge_name}` : `+${inc.value} Pts`}
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{inc.trigger_event}</td>
                      <td className="p-3 text-slate-300">{inc.why_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INSTITUTIONAL PARTNERS */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Institutional Partner Onboarding (GHMC, Universities, Corporates, NGOs)
              </h3>
              <p className="text-xs text-slate-400">
                Configurable onboarding lifecycle (APPLICATION → ACTIVE). Scoped institutional e-waste collection drives.
              </p>
            </div>
            <button
              onClick={() => setPartnerModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              + Onboard New Partner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-cyan-400">{p.partner_code}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      p.verification_status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      p.verification_status === 'APPLICATION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {p.verification_status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-0.5">{p.name}</h4>
                  <div className="text-xs text-slate-400 mb-3">{p.partner_type} • {p.service_area}, {p.city}</div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs mb-3">
                    <div>
                      <span className="text-slate-400">Formalized Tonnage:</span>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">{p.total_formalized_kg} kg</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Active Campaigns:</span>
                      <p className="font-bold text-white text-sm mt-0.5">{p.active_campaigns_count}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-400">Material Focus:</span> {p.material_capabilities}</div>
                    {p.contact_person && <div><span className="text-slate-400">Contact:</span> {p.contact_person} ({p.contact_email || p.contact_phone})</div>}
                  </div>
                </div>

                {p.verification_status === 'APPLICATION' && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end space-x-2">
                    <button
                      onClick={() => handleVerifyPartner(p.id, 'ACTIVE')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Activate
                    </button>
                    <button
                      onClick={() => handleVerifyPartner(p.id, 'REJECTED')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: POLICY SIMULATOR */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  Multi-Scenario Circular Policy What-If Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Estimates operational outcomes across Baseline vs Policy A vs Policy B. Tagged strictly as SIMULATION - NOT POLICY ADVICE.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Deterministic Capacity Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Collector Surge: +{simParams.collector_surge_pct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simParams.collector_surge_pct}
                  onChange={(e) => setSimParams({...simParams, collector_surge_pct: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Recycler Capacity: +{simParams.recycler_capacity_delta_pct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simParams.recycler_capacity_delta_pct}
                  onChange={(e) => setSimParams({...simParams, recycler_capacity_delta_pct: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Pickup Fleet Headroom: +{simParams.pickup_fleet_delta_pct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simParams.pickup_fleet_delta_pct}
                  onChange={(e) => setSimParams({...simParams, pickup_fleet_delta_pct: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Campaign Intensity: +{simParams.campaign_intensity_pct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simParams.campaign_intensity_pct}
                  onChange={(e) => setSimParams({...simParams, campaign_intensity_pct: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Incentive Multiplier: {simParams.incentive_multiplier}x
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={simParams.incentive_multiplier}
                  onChange={(e) => setSimParams({...simParams, incentive_multiplier: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 text-sm shadow-lg shadow-indigo-900/30"
              >
                <Sparkles className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                <span>{simulating ? 'Computing What-If Models...' : 'Calculate 3-Way Scenario Comparison'}</span>
              </button>
            </div>

            {simResult && (
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Baseline Card */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {simResult.baseline?.scenario_name || 'Baseline Status Quo'}
                    </span>
                    <div className="text-2xl font-black text-white mt-1 mb-3">
                      {simResult.baseline?.projected_formalized_kg || 408.5} kg
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Bottleneck Risk:</span>
                        <span className="font-semibold text-slate-300">{simResult.baseline?.bottleneck_risk || 'LOW'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trace Completeness:</span>
                        <span className="font-semibold text-white">{simResult.baseline?.estimated_trace_pct || '84.2%'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenario A Card */}
                  <div className="bg-indigo-950/20 p-5 rounded-2xl border border-indigo-500/40">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                      {simResult.scenario_a?.scenario_name || 'Scenario A (Incentive Surge)'}
                    </span>
                    <div className="text-2xl font-black text-indigo-300 mt-1 mb-3">
                      {simResult.scenario_a?.projected_formalized_kg} kg
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Tonnage Delta:</span>
                        <span className="font-bold text-emerald-400">+{simResult.scenario_a?.delta_pct || 18.5}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bottleneck Risk:</span>
                        <span className="font-semibold text-amber-400">{simResult.scenario_a?.bottleneck_risk || 'MEDIUM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenario B Card */}
                  <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/40">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      {simResult.scenario_b?.scenario_name || 'Scenario B (Balanced Infrastructure)'}
                    </span>
                    <div className="text-2xl font-black text-emerald-300 mt-1 mb-3">
                      {simResult.scenario_b?.projected_formalized_kg} kg
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Tonnage Delta:</span>
                        <span className="font-bold text-emerald-400">+{simResult.scenario_b?.delta_pct || 42.0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bottleneck Risk:</span>
                        <span className="font-semibold text-emerald-400">{simResult.scenario_b?.bottleneck_risk || 'MINIMAL'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <span className="font-bold text-slate-300 block">Simulation Assumptions & Methodological Boundaries:</span>
                  <p>{simResult.limitations}</p>
                  <p className="text-emerald-400 font-semibold">{simResult.actionable_guidance}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: MATERIAL FLOW & TRACEABILITY GAPS */}
      {activeTab === 'materialFlow' && materialFlow && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Material Flow Analytics & Drop-Off Detection ({materialFlow.material})
                </h3>
                <p className="text-xs text-slate-400">
                  Tracks custody volume across all 7 operational stages. Flags downstream unaccounted discrepancies as "Traceability Gaps".
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Circularity Index</span>
                <span className="text-2xl font-extrabold text-emerald-400">{materialFlow.circularity_index_pct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
              {materialFlow.stages?.map((stage, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <span className="font-semibold text-slate-300 block truncate">{stage.stage_name}</span>
                  <div className="text-base font-bold text-white my-1">{stage.outflow_kg} kg</div>
                  <span className={`text-[10px] font-semibold ${stage.drop_off_pct > 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                    Drop-off: {stage.drop_off_pct}%
                  </span>
                </div>
              ))}
            </div>

            {materialFlow.traceability_gaps?.length > 0 && (
              <div className="mt-4 p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Detected Traceability Gaps (Audit Required)
                </h4>
                <div className="space-y-2">
                  {materialFlow.traceability_gaps.map((gap, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-300 border-b border-amber-500/20 pb-1.5 last:border-0 last:pb-0">
                      <span>{gap.gap_description || gap.stage_name}</span>
                      <span className="font-mono text-amber-300 font-semibold">{gap.unaccounted_kg} kg unaccounted</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: DATA QUALITY */}
      {activeTab === 'dataQuality' && dataQuality && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Overall Data Quality Score</span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">{dataQuality.overall_score} / 100</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Completeness</span>
              <p className="text-2xl font-bold text-white mt-1">{dataQuality.score_breakdown?.completeness_score || 94.0}%</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Consistency</span>
              <p className="text-2xl font-bold text-white mt-1">{dataQuality.score_breakdown?.consistency_score || 96.2}%</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 uppercase font-bold">Trace Chaining</span>
              <p className="text-2xl font-bold text-white mt-1">{dataQuality.score_breakdown?.traceability_score || 98.0}%</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-3">Actionable Data Remediation Center</h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Problem Statement</th>
                    <th className="p-3">Affected Records</th>
                    <th className="p-3">Recommended Remediation</th>
                    <th className="p-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {dataQuality.issues?.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{issue.category}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                          issue.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200">{issue.problem}</td>
                      <td className="p-3 font-mono">{issue.affected_records_count}</td>
                      <td className="p-3 text-slate-300">{issue.recommended_fix}</td>
                      <td className="p-3 font-semibold text-cyan-400">{issue.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: POLICY RULES & ROLLBACK */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-400" />
              Policy Center & Immutable Version Governance
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All threshold changes record previous/new states, timestamps, and admin identity. Safely rollback to previous versions at any time.
            </p>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Policy Key</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Version</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {policyRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-cyan-400">{rule.policy_key}</td>
                      <td className="p-3 text-slate-400">{rule.policy_category}</td>
                      <td className="p-3 font-medium text-white">{rule.name}</td>
                      <td className="p-3 font-bold text-emerald-400">{rule.current_value}</td>
                      <td className="p-3 text-slate-400">{rule.unit || '—'}</td>
                      <td className="p-3 font-mono">v{rule.version}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleViewPolicyVersions(rule.policy_key)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold"
                        >
                          History & Rollback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: INCIDENTS & PLAYBOOKS */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Circular Economy Operational Incident Management & Response Playbooks
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Standard operating procedures for capacity crises, logistics backlogs, and post-incident learning reviews.
            </p>

            <div className="space-y-4">
              {incidents.map(inc => (
                <div key={inc.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">{inc.incident_code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      inc.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                      inc.severity === 'CRITICAL' ? 'bg-red-600/30 text-red-200 animate-pulse' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inc.severity} SEVERITY
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{inc.title}</h4>
                  <div className="text-xs text-slate-400 mb-3">
                    Playbook: <span className="text-indigo-400 font-semibold">{inc.playbook_applied || 'STANDARD_CPCB_PLAYBOOK'}</span> • Assigned To: <span className="text-white">{inc.assigned_to}</span>
                  </div>

                  {inc.evidence_text && (
                    <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 mb-2 border border-slate-800">
                      <span className="text-slate-400 font-semibold block mb-0.5">Evidence & Telemetry:</span>
                      {inc.evidence_text}
                    </div>
                  )}

                  {inc.post_incident_learning && (
                    <div className="p-3 bg-emerald-950/20 rounded-lg text-xs text-emerald-300 border border-emerald-500/30">
                      <span className="font-semibold block mb-0.5">Post-Incident Learning:</span>
                      {inc.post_incident_learning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE RESOLUTION MODAL */}
      {disputeModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Inspect Evidence & Decide Dispute ({selectedDispute.dispute_code})
              </h3>
              <button onClick={() => setDisputeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Claim Title:</span>
                <p className="font-semibold text-white text-sm">{selectedDispute.title}</p>
                <p className="text-slate-300 mt-1">{selectedDispute.claim_description}</p>
              </div>

              {selectedDispute.evidence_package && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400 block">Ground-Truth Evidence Package:</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Trace ID: <span className="font-mono text-white">{selectedDispute.evidence_package.trace_id || 'TRC-2026-EW-0089'}</span></div>
                    <div>Claimant: <span className="text-white">{selectedDispute.evidence_package.claimant}</span></div>
                    {selectedDispute.evidence_package.tare_weighbridge_log && (
                      <div className="col-span-2 p-2 bg-slate-900 rounded border border-slate-800 text-[11px]">
                        Weighbridge Gross Scale: <span className="font-bold text-white">{selectedDispute.evidence_package.tare_weighbridge_log.gross_scale_kg} kg</span> | Dock: {selectedDispute.evidence_package.tare_weighbridge_log.dock_operator}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleResolveDispute} className="space-y-3 pt-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Admin Decision Action:</label>
                  <select
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="RESOLVE">Resolve (Accept Tare Adjustment / Signoff)</option>
                    <option value="DISMISS">Dismiss (Record Invalid / Scale Calibrated)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Formal Resolution Notes & Audit Rationale:</label>
                  <textarea
                    rows="3"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter audit rationale for decision..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResolution}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    {submittingResolution ? 'Submitting...' : 'Authorize Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POLICY VERSION HISTORY & ROLLBACK MODAL */}
      {versionModalOpen && selectedPolicyVersions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                Version Audit History: {selectedPolicyVersions.key}
              </h3>
              <button onClick={() => setVersionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedPolicyVersions.versions?.map(v => (
                <div key={v.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">v{v.version}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{v.new_value}</span>
                      {v.previous_value && <span className="text-slate-500">(prev: {v.previous_value})</span>}
                    </div>
                    <div className="text-slate-400 mt-1">
                      Reason: <span className="text-slate-300">{v.reason || 'Configured baseline'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      By {v.changed_by_admin_name} on {new Date(v.created_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRollbackPolicy(selectedPolicyVersions.key, v.version)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Restore v{v.version}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NETWORK HEALTH BREAKDOWN MODAL ("WHY THIS SCORE?") */}
      {healthModalOpen && networkHealth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Network Health Calculation & Factor Explainability
              </h3>
              <button onClick={() => setHealthModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Transparent Calculation Formula:</span>
              <p className="font-mono text-emerald-300">{networkHealth.calculation_formula}</p>
            </div>

            <div className="space-y-2">
              {networkHealth.contributing_factors?.map((f, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white block">{f.factor}</span>
                    <span className="text-slate-400 text-[11px]">{f.interpretation}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-bold block">{f.value}</span>
                    <span className="text-[10px] text-slate-500">Weight: {(f.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL REPORT MODAL */}
      {reportModalOpen && institutionalReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  {institutionalReport.report_title}
                </h3>
                <span className="text-[11px] text-amber-400 font-semibold">
                  Classification: {institutionalReport.environment_classification}
                </span>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {Object.entries(institutionalReport.sections || {}).map(([key, val]) => (
                <div key={key} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      {val.tag}
                    </span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    {Object.entries(val).filter(([k]) => k !== 'tag').map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-white">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PARTNER ONBOARDING MODAL */}
      {partnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Register Institutional Partner Application
              </h3>
              <button onClick={() => setPartnerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Organization Name:</label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  placeholder="e.g. GHMC Ward 14 Solid Waste Hub"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Partner Type:</label>
                  <select
                    value={newPartner.partner_type}
                    onChange={(e) => setNewPartner({...newPartner, partner_type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="MUNICIPALITY">Municipality</option>
                    <option value="UNIVERSITY">University / Campus</option>
                    <option value="CORPORATE">Corporate IT Hub</option>
                    <option value="NGO">NGO Foundation</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Service Area:</label>
                  <input
                    type="text"
                    required
                    value={newPartner.service_area}
                    onChange={(e) => setNewPartner({...newPartner, service_area: e.target.value})}
                    placeholder="e.g. Hyderabad Central"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Person:</label>
                  <input
                    type="text"
                    value={newPartner.contact_person}
                    onChange={(e) => setNewPartner({...newPartner, contact_person: e.target.value})}
                    placeholder="Dr. K. Rao"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Email:</label>
                  <input
                    type="email"
                    value={newPartner.contact_email}
                    onChange={(e) => setNewPartner({...newPartner, contact_email: e.target.value})}
                    placeholder="officer@ghmc.gov.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Material Capabilities:</label>
                <input
                  type="text"
                  value={newPartner.material_capabilities}
                  onChange={(e) => setNewPartner({...newPartner, material_capabilities: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
