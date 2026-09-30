import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, PlayCircle, RefreshCw, CheckCircle2, AlertTriangle, 
  WifiOff, ShieldAlert, Cpu, ArrowRight, Clock, Award, Check
} from 'lucide-react';
import axios from 'axios';

export default function AdminDemoControlView() {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90);

  // Timer effect
  React.useEffect(() => {
    let interval = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(sec => sec - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const handleStartTimer = () => {
    setSecondsLeft(90);
    setTimerRunning(true);
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await axios.post('/api/admin/demo/reset');
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setResetModalOpen(false);
      }, 1500);
    } catch (err) {
      alert("Failed to reset demo: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const launchScenario = async (scenarioId, directRoute) => {
    try {
      const res = await axios.post(`/api/admin/demo/scenario/${scenarioId}`);
      setActiveScenario(res.data);
      if (directRoute) {
        navigate(directRoute);
      }
    } catch (err) {
      console.error("Scenario launch error:", err);
    }
  };

  const scenarios = [
    {
      id: "scenario_1",
      title: "Scenario 1: Collector Story",
      badge: "Multilingual AI",
      badgeColor: "emerald",
      desc: "Collector opens in Telugu / Hindi / Tamil, captures PCB photo, AI identifies 94% confidence, verifies non-exploitative fair price ₹510/kg, and issues QR Trace ID.",
      actionText: "Launch Collector Flow",
      route: "/collector/identify"
    },
    {
      id: "scenario_2",
      title: "Scenario 2: Offline-First Operation",
      badge: "Zero Network Loss",
      badgeColor: "teal",
      desc: "Simulate offline mode. Lot is recorded in browser IndexedDB with deterministic client_action_id. Reconnecting auto-syncs with server ID without duplicate loss.",
      actionText: "Open Offline Simulator",
      route: "/collector/create-lot"
    },
    {
      id: "scenario_3",
      title: "Scenario 3: Government Command Center",
      badge: "CPCB / Admin",
      badgeColor: "amber",
      desc: "Executive governance view with ESG Scorecard, informal formalization funnel, and instant drill-down into Digital Material Passports.",
      actionText: "View Command Center",
      route: "/admin"
    },
    {
      id: "scenario_4",
      title: "Scenario 4: Battery Safety Intelligence",
      badge: "Hazard Prevention",
      badgeColor: "rose",
      desc: "AI flags high-hazard Lithium Battery, triggers localized voice warning in Telugu/Tamil/Hindi, and displays thermal runaway containment protocols.",
      actionText: "View Safety Guidelines",
      route: "/collector/safety"
    },
    {
      id: "scenario_5",
      title: "Scenario 5: Capacity Pressure Alert",
      badge: "Operational Insight",
      badgeColor: "purple",
      desc: "Circular twin detects PCB supply exceeding 85% regional recycler capacity and triggers deterministic operational alert to onboard dismantlers.",
      actionText: "Inspect Circular Twin",
      route: "/admin/circular-flow"
    },
    {
      id: "scenario_6",
      title: "Scenario 6: Digital Material Passport",
      badge: "Traceability 2.0",
      badgeColor: "sky",
      desc: "Canonical traceable lot RC-2026-000241 with 14-stage journey, cryptographic SHA-256 chain verification, and privacy-protected collector metadata.",
      actionText: "Open Material Passport",
      route: "/passport/RC-2026-000241"
    },
    {
      id: "scenario_7",
      title: "Scenario 7: Closed-Loop Network Intelligence",
      badge: "Phase 11 Autonomous",
      badgeColor: "emerald",
      desc: "PCB capacity bottleneck detected at 94% ceiling → System analyzes ground-truth database records → Generates recommendation REC-2026-001 with evidence & counterfactual → Admin executes human-in-the-loop approval → Decision history audit written & network rebalanced.",
      actionText: "Launch Intelligence Center",
      route: "/admin/intelligence"
    }
  ];


  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/60 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>SIH 2026 GRAND FINALE</span>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white">
            Demo Control Panel & Presentation Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Preconfigured evaluation workflows, judge timer, and 1-click test scenarios.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setResetModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Environment</span>
          </button>
        </div>
      </div>

      {/* 90-Second Judge Presentation Timer & Script */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                90-SECOND GRAND FINALE DEMO SCRIPT
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Structured time-boxed flow recommended for SIH Grand Finale evaluation panel.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xl font-bold text-emerald-400">
              {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
            </div>
            <button
              onClick={handleStartTimer}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              {timerRunning ? 'Restart 90s' : 'Start 90s Timer'}
            </button>
          </div>
        </div>

        {/* 4 Time Slots */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-mono text-emerald-400 font-bold text-[10px]">00:00 – 00:20</div>
            <div className="font-bold text-white mt-1">Problem & Landing</div>
            <p className="text-slate-400 text-[11px] mt-1">
              "India collects 90% e-waste informally. RECYCLINK creates the digital bridge to formal recycling."
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-mono text-emerald-400 font-bold text-[10px]">00:20 – 00:45</div>
            <div className="font-bold text-white mt-1">Collector + AI + Telugu</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Select Telugu/Hindi. Snap photo. Show 94% PCB confidence, hazard alert, and fair price ₹510/kg.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-mono text-emerald-400 font-bold text-[10px]">00:45 – 01:10</div>
            <div className="font-bold text-white mt-1">Offline Sync + Matching</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Toggle offline. Lot saves locally with UUID. Toggle online: auto-syncs. Recycler assigned via EV cluster.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-mono text-emerald-400 font-bold text-[10px]">01:10 – 01:30</div>
            <div className="font-bold text-white mt-1">Material Passport + Admin</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Open Digital Material Passport (RC-2026-000241). Show 14-stage journey and SHA-256 cryptographic chain.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Presentation Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <div 
            key={s.id}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className="font-mono font-bold text-slate-400">{s.id.toUpperCase()}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {s.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white mb-1.5">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-normal mb-4">
                {s.desc}
              </p>
            </div>

            <button
              onClick={() => launchScenario(s.id, s.route)}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
            >
              <span>{s.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Reset Demo Environment?</h3>
            <p className="text-xs text-slate-400 mb-4">
              This will safely re-initialize baseline test transactions, clear temporary demo drafts, and ensure the canonical trace (RC-2026-000241) is in a pristine state for judges. System users will NOT be deleted.
            </p>

            {resetSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>Demo environment reset successfully!</span>
              </div>
            ) : (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetDemo}
                  disabled={resetting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-400 transition"
                >
                  {resetting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
