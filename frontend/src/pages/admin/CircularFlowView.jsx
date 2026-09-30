import React, { useState, useEffect } from 'react';
import { 
  Recycle, AlertTriangle, ArrowRight, ShieldCheck, Cpu, 
  Layers, Sliders, TrendingUp, Users, Calendar, MapPin, 
  Truck, CheckCircle2, Info, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import axios from 'axios';

export default function CircularFlowView() {
  const [flowData, setFlowData] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [drives, setDrives] = useState([]);
  const [simPercent, setSimPercent] = useState(25);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: '',
    location: '',
    city: 'Hyderabad',
    target_weight_kg: 1000,
    target_collectors: 50,
    accepted_materials: 'PCB, Battery, Cable, LCD'
  });

  const fetchCircularData = async () => {
    setLoading(true);
    try {
      const [flowRes, clusterRes, driveRes] = await Promise.all([
        axios.get('/api/admin/circular-flow'),
        axios.get('/api/admin/pickup-clusters'),
        axios.get('/api/admin/collection-drives')
      ]);
      setFlowData(flowRes.data);
      setClusters(clusterRes.data);
      setDrives(driveRes.data);
    } catch (err) {
      console.error("Error loading circular flow data:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (pct) => {
    setSimLoading(true);
    try {
      const res = await axios.get(`/api/admin/scenario-simulation?participation_pct=${pct}`);
      setSimulation(res.data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    fetchCircularData();
    runSimulation(simPercent);
  }, []);

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setSimPercent(val);
    runSimulation(val);
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/collection-drives', newDrive);
      setShowDriveModal(false);
      setNewDrive({
        title: '',
        location: '',
        city: 'Hyderabad',
        target_weight_kg: 1000,
        target_collectors: 50,
        accepted_materials: 'PCB, Battery, Cable, LCD'
      });
      // Refresh
      const driveRes = await axios.get('/api/admin/collection-drives');
      setDrives(driveRes.data);
    } catch (err) {
      alert("Failed to create collection drive: " + (err.response?.data?.error?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-xs font-medium">Loading Circular Economy Digital Twin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Recycle className="w-4 h-4" />
            <span>CIRCULAR ECONOMY DIGITAL TWIN</span>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white">
            Material Flow & Capacity Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end visual mapping from informal collection intake to secondary raw material recovery.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            Circularity Score: {flowData?.overall_circularity_score || 84.6}%
          </span>
          <button
            onClick={fetchCircularData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Refresh Digital Twin Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6-Stage Circular Lifecycle Flow */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
          <span>6-STAGE CIRCULAR CHAIN LIFECYCLE</span>
          <span className="text-[10px] text-emerald-400 font-mono">DETERMINISTIC VERIFIED DATA</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(flowData?.stages || []).map((stage, idx) => (
            <div 
              key={stage.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-mono font-bold text-emerald-400">0{idx + 1}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {stage.data_source === 'VERIFIED_PLATFORM_DATA' ? 'LIVE DATA' : 'READY'}
                  </span>
                </div>
                <div className="font-bold text-xs text-white leading-tight mb-2">
                  {stage.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mb-3">
                  {stage.description}
                </p>
              </div>

              {/* Metric summary */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1">
                {Object.entries(stage.metrics || {}).slice(0, 2).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-slate-400">
                    <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="font-mono font-bold text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material Demand Map & Capacity Pressure Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Supply vs Recycler Capacity Map */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  MATERIAL DEMAND & CAPACITY MAP
                </h3>
                <p className="text-xs text-slate-400">
                  Compares informal collector intake volume vs licensed recycler processing capacity
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                CPCB BENCHMARK
              </span>
            </div>

            <div className="space-y-3.5">
              {(flowData?.material_flows || []).map((flow) => {
                const isPressure = flow.has_pressure;
                return (
                  <div key={flow.material} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{flow.material}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isPressure 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {flow.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        {flow.supply_kg} kg / {flow.demand_capacity_kg} kg ({flow.utilization_pct}%)
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPressure ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, flow.utilization_pct)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-start space-x-1.5">
                      <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{flow.recommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* What-If Scenario Simulator */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>WHAT-IF SCENARIO SIMULATOR</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Informal Collector Formalization Projection
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SIMULATION
              </span>
            </div>

            {/* Slider control */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium">Informal Participation Increase:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">+{simPercent}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="100"
                step="5"
                value={simPercent}
                onChange={handleSliderChange}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>+10%</span>
                <span>+25%</span>
                <span>+50%</span>
                <span>+75%</span>
                <span>+100%</span>
              </div>
            </div>

            {/* Projected Outputs Grid */}
            {simulation && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Projected Collection Volume</div>
                  <div className="text-lg font-mono font-bold text-white mt-1">
                    {simulation.projected?.monthly_collection_kg} kg
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    +{simulation.projected?.additional_monthly_kg} kg net increase
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Projected Collector Payouts</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    ₹{simulation.projected?.total_payout_inr?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    +₹{simulation.projected?.additional_payout_inr?.toLocaleString('en-IN')} additional informal income
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Recycler Capacity Strain</div>
                  <div className={`text-lg font-mono font-bold mt-1 ${
                    simulation.projected?.capacity_alert ? 'text-rose-400' : 'text-teal-400'
                  }`}>
                    {simulation.projected?.recycler_capacity_strain_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {simulation.projected?.capacity_alert ? '⚠ Bottlenecks anticipated' : '✓ Capacity adequate'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Projected Collectors</div>
                  <div className="text-lg font-mono font-bold text-white mt-1">
                    {simulation.projected?.collectors_count}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Active registered kabadiwalas
                  </div>
                </div>
              </div>
            )}

            {/* Assumptions & Formula */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300">SCIENTIFIC IMPACT ASSUMPTION (TRANSPARENT):</div>
              <div>Formula: <code className="text-emerald-400">{simulation?.impact_assumptions?.formula}</code></div>
              <div>Source: {simulation?.impact_assumptions?.source}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Smart Pickup Logistics Clusters & Community Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Smart Pickup Batching Clusters */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                SMART PICKUP BATCHING CLUSTERS
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {clusters.length} Active Hubs
            </span>
          </div>

          <div className="space-y-3">
            {clusters.map((c) => (
              <div key={c.cluster_id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white">{c.hub_name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{c.total_weight_kg} kg</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-3 mb-2">
                  <span>Vehicle: <strong className="text-slate-200">{c.suggested_vehicle}</strong></span>
                  <span>Lots: <strong className="text-slate-200">{c.lot_count}</strong></span>
                  <span>CO₂ Saved: <strong className="text-teal-300">{c.co2_saving_kg} kg</strong></span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                  <span>Assigned: {c.recommended_recycler}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community E-Waste Collection Drives */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                COMMUNITY AGGREGATION DRIVES
              </h3>
            </div>
            <button
              onClick={() => setShowDriveModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Drive</span>
            </button>
          </div>

          <div className="space-y-3">
            {drives.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white">{d.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    d.status === 'ACTIVE' 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : (d.status === 'COMPLETED' ? 'bg-slate-800 text-slate-300' : 'bg-teal-500/20 text-teal-300')
                  }`}>
                    {d.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-2 mb-2">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{d.location}, {d.city}</span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Collected: {d.collected_weight_kg} kg of {d.target_weight_kg} kg</span>
                  <span className="font-mono font-bold text-emerald-400">{d.progress_pct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, d.progress_pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal for Creating Community Drive */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Create Community Collection Drive</h3>
            <form onSubmit={handleCreateDrive} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Drive Title</label>
                <input 
                  type="text"
                  required
                  value={newDrive.title}
                  onChange={(e) => setNewDrive({...newDrive, title: e.target.value})}
                  placeholder="e.g. Madhapur E-Waste Clean Drive"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Location</label>
                <input 
                  type="text"
                  required
                  value={newDrive.location}
                  onChange={(e) => setNewDrive({...newDrive, location: e.target.value})}
                  placeholder="e.g. Community Center, Kukatpally"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Weight (kg)</label>
                  <input 
                    type="number"
                    value={newDrive.target_weight_kg}
                    onChange={(e) => setNewDrive({...newDrive, target_weight_kg: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Collectors</label>
                  <input 
                    type="number"
                    value={newDrive.target_collectors}
                    onChange={(e) => setNewDrive({...newDrive, target_collectors: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Create Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
