import React, { useState, useEffect } from 'react';
import { 
  Camera, Upload, Sparkles, Scale, Building2, QrCode, 
  ShieldAlert, IndianRupee, ArrowRight, CheckCircle2, 
  Flame, BatteryCharging, AlertTriangle, RefreshCw, Layers, Check, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { 
  classifyMaterial, estimatePrice, getRecommendedRecyclers, 
  createLot, getCollectorDashboard, getSafetyGuides 
} from '../services/api';
import { offlineSyncManager } from '../services/offlineSync';

const DEMO_SAMPLES = [
  { key: 'pcb', name: 'PCB Motherboard', icon: '💻', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80' },
  { key: 'cable', name: 'Copper Cables', icon: '🔌', img: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&q=80' },
  { key: 'battery', name: 'Lithium Battery', icon: '🔋', img: 'https://images.unsplash.com/photo-1619641782821-75178523cf44?w=500&q=80' },
  { key: 'crt', name: 'CRT Monitor', icon: '📺', img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80' },
  { key: 'motor', name: 'Electric Motor', icon: '⚙️', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80' },
  { key: 'mixed', name: 'Mixed E-Waste', icon: '📦', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80' }
];

export default function CollectorPortal({ onLotCreated, isOffline }) {
  const { user } = useAuth();
  const { t } = useI18n();

  // Tab navigation
  const [tab, setTab] = useState('scanner'); // 'scanner', 'pricing', 'recyclers', 'safety', 'drafts'

  // Workflow State
  const [stats, setStats] = useState(null);
  const [selectedSample, setSelectedSample] = useState(DEMO_SAMPLES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [recyclers, setRecyclers] = useState([]);
  const [selectedRecycler, setSelectedRecycler] = useState(null);
  const [createdLot, setCreatedLot] = useState(null);
  const [safetyGuides, setSafetyGuides] = useState([]);
  const [draftWeight, setDraftWeight] = useState(2.4);
  const [statusMsg, setStatusMsg] = useState('');

  // Load collector stats
  useEffect(() => {
    loadStats();
    loadGuides();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getCollectorDashboard();
      setStats(data);
    } catch (err) {
      console.warn("Using fallback stats");
      setStats({
        today_earnings: 910.0,
        total_earnings: 62400.0,
        active_lots_count: 2,
        pending_pickups_count: 1,
        completed_tx_count: 14,
        total_kg_collected: 145.0,
        rating: 4.9
      });
    }
  };

  const loadGuides = async () => {
    try {
      const data = await getSafetyGuides();
      setSafetyGuides(data);
    } catch {
      // fallback
    }
  };

  // 1. Run AI Material Classification
  const handleClassify = async (sample) => {
    setSelectedSample(sample);
    setIsScanning(true);
    setStatusMsg('');
    try {
      const res = await classifyMaterial({ sample_key: sample.key, location: user?.city || 'Hyderabad' });
      setAiResult(res);
      setDraftWeight(res.estimated_weight_kg);

      // Automatically prefetch fair pricing
      const priceRes = await estimatePrice({
        material: res.material_category,
        weight_kg: res.estimated_weight_kg,
        location_city: user?.city || 'Hyderabad'
      });
      setPricingData(priceRes);

      // Automatically prefetch nearby recyclers
      const recs = await getRecommendedRecyclers({
        material: res.material_category,
        weight: res.estimated_weight_kg
      });
      setRecyclers(recs);
      if (recs.length > 0) setSelectedRecycler(recs[0]);

    } catch (err) {
      setStatusMsg('AI Model offline. Switching to rule-based classification.');
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Create Lot & Generate QR (Supports Offline mode!)
  const handleCreateLot = async () => {
    if (!aiResult) return;

    if (isOffline) {
      // Offline mode: save draft in IndexedDB/localStorage queue
      const draft = {
        material_name: aiResult.material_category,
        subcategory: aiResult.material_subcategory,
        weight_kg: draftWeight,
        recommended_price: pricingData?.recommended_fair_price_per_kg || 455.0,
        hazard_level: aiResult.hazard_level,
        photo_url: aiResult.sample_image_url
      };
      const enqueued = offlineSyncManager.enqueueDraft(draft);
      setStatusMsg(`🟢 DRAFT SAVED LOCALLY: ${enqueued.client_id}. Will auto-sync when network returns!`);
      setCreatedLot({
        trace_id: "DRAFT-OFFLINE-QUEUE",
        material_name: draft.material_name,
        estimated_weight: draft.weight_kg,
        recommended_price: draft.recommended_price * draft.weight_kg,
        is_offline_draft: true
      });
      return;
    }

    try {
      const payload = {
        material_name: aiResult.material_category,
        subcategory: aiResult.material_subcategory,
        weight_kg: draftWeight,
        quoted_price: pricingData ? (pricingData.recommended_fair_price_per_kg * draftWeight) : 1092.0,
        location_address: `${user?.city || 'Hyderabad'}, India`,
        photo_url: aiResult.sample_image_url,
        ai_confidence: aiResult.confidence,
        hazard_level: aiResult.hazard_level
      };
      const lot = await createLot(payload);
      setCreatedLot(lot);
      if (onLotCreated) onLotCreated(lot);
      loadStats();
    } catch (err) {
      setStatusMsg('Lot creation failed. Saving to offline drafts.');
      offlineSyncManager.enqueueDraft({
        material_name: aiResult.material_category,
        weight_kg: draftWeight
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Mobile-first Header Profile Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-400">
            {user?.full_name?.charAt(0) || 'K'}
          </div>
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              {user?.full_name || 'Ramesh Kabadiwala'}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>📍 {user?.city || 'Hyderabad'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">★ 4.9 Verified Collector</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">{t('today_earnings', "Today's Earnings")}</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-emerald-400">
            ₹{stats?.today_earnings || 455}
          </span>
        </div>
      </div>

      {/* Collector Quick Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="glass-panel p-3 rounded-xl text-center">
          <span className="text-[10px] sm:text-xs text-slate-400 block truncate">{t('active_lots', 'Active Lots')}</span>
          <span className="text-lg sm:text-xl font-bold font-display text-white">{stats?.active_lots_count ?? 2}</span>
        </div>
        <div className="glass-panel p-3 rounded-xl text-center">
          <span className="text-[10px] sm:text-xs text-slate-400 block truncate">{t('pending_pickups', 'Pickups')}</span>
          <span className="text-lg sm:text-xl font-bold font-display text-amber-400">{stats?.pending_pickups_count ?? 1}</span>
        </div>
        <div className="glass-panel p-3 rounded-xl text-center">
          <span className="text-[10px] sm:text-xs text-slate-400 block truncate">{t('total_kg', 'Total kg')}</span>
          <span className="text-lg sm:text-xl font-bold font-display text-emerald-400">{stats?.total_kg_collected ?? 145} kg</span>
        </div>
      </div>

      {/* Action Tabs for Collector */}
      <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
        <button
          onClick={() => setTab('scanner')}
          className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition ${
            tab === 'scanner' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>1. Scan Material</span>
        </button>

        <button
          onClick={() => setTab('pricing')}
          className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition ${
            tab === 'pricing' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>2. Fair Price</span>
        </button>

        <button
          onClick={() => setTab('recyclers')}
          className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition ${
            tab === 'recyclers' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>3. Recyclers</span>
        </button>

        <button
          onClick={() => setTab('safety')}
          className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition ${
            tab === 'safety' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Safety</span>
        </button>
      </div>

      {/* TAB 1: AI MATERIAL IDENTIFICATION */}
      {tab === 'scanner' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="font-display font-bold text-base sm:text-lg text-white mb-1 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t('ai_scanner_title', 'AI E-Waste Material Scanner')}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a component below or snap a picture. AI identifies precious metals & recommended price.
            </p>

            {/* Visual Demo Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {DEMO_SAMPLES.map((sample) => (
                <button
                  key={sample.key}
                  onClick={() => handleClassify(sample)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center space-y-1 ${
                    selectedSample.key === sample.key 
                      ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-sm' 
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{sample.icon}</span>
                  <span className="text-[11px] font-semibold leading-tight line-clamp-1">{sample.name}</span>
                </button>
              ))}
            </div>

            {/* Run Button */}
            <button
              onClick={() => handleClassify(selectedSample)}
              disabled={isScanning}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>{isScanning ? 'AI Vision Analyzing Material...' : `Scan & Identify ${selectedSample.name}`}</span>
            </button>
          </div>

          {/* AI Result Card */}
          {aiResult && (
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/10 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI Vision Identified (Confidence: {(aiResult.confidence * 100).toFixed(0)}%)
                  </span>
                  <h4 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                    {aiResult.detected_material}
                  </h4>
                  <p className="text-xs text-slate-400">{aiResult.material_subcategory}</p>
                </div>
                
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  aiResult.hazard_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  aiResult.hazard_level === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  Hazard: {aiResult.hazard_level}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Estimated Weight</span>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <input
                      type="number"
                      step="0.1"
                      value={draftWeight}
                      onChange={(e) => setDraftWeight(parseFloat(e.target.value) || 1.0)}
                      className="w-16 bg-slate-800 text-white font-bold text-sm px-1.5 py-0.5 rounded border border-slate-700"
                    />
                    <span className="text-xs text-slate-400">kg</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Recommended Fair Rate</span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    ₹{aiResult.recommended_fair_price} / kg
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Estimated Lot Value</span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    ₹{(aiResult.recommended_fair_price * draftWeight).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Recoverable precious materials */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Recoverable Precious Metals Detected:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.recoverable_materials?.map((metal, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      ⚡ {metal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  onClick={() => setTab('pricing')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1"
                >
                  <span>Check Live Fair Price</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAIR PRICE INTELLIGENCE */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="font-display font-bold text-base sm:text-lg text-white mb-1">
              Fair Price Intelligence Engine
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time commodity price benchmark for {aiResult?.detected_material || 'PCB'} ({draftWeight} kg).
            </p>

            {/* Price Gauge Box */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Market Low: ₹{pricingData?.market_range_min_per_kg || 390}/kg</span>
                <span className="text-emerald-400 font-bold">CPCB Index: ₹{pricingData?.recommended_fair_price_per_kg || 455}/kg</span>
                <span>Market High: ₹{pricingData?.market_range_max_per_kg || 480}/kg</span>
              </div>

              {/* Visual Range Bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 relative overflow-hidden flex">
                <div className="w-1/3 bg-amber-500/60 h-full" title="Below Fair" />
                <div className="w-1/2 bg-emerald-500 h-full" title="Recommended Benchmark" />
                <div className="w-1/6 bg-teal-400 h-full" title="Premium" />
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 block">Recommended Fair Total Payout</span>
                <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-400">
                  ₹{((pricingData?.recommended_fair_price_per_kg || 455) * draftWeight).toFixed(0)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Calculated at ₹{pricingData?.recommended_fair_price_per_kg || 455}/kg for {draftWeight} kg
                </span>
              </div>
            </div>

            {/* Recycler Bids Comparison */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Nearby Recycler Offers Comparison:</span>
              {(pricingData?.nearby_recycler_offers || [
                { recycler_name: "GreenCycle E-Waste Tech", offer_rate_per_kg: 465, distance_km: 4.2, status_label: "GOOD OFFER" },
                { recycler_name: "EcoFormal Recovery India", offer_rate_per_kg: 450, distance_km: 7.5, status_label: "FAIR" },
                { recycler_name: "Bharat Circular Refiners", offer_rate_per_kg: 440, distance_km: 11.0, status_label: "BELOW FAIR" }
              ]).map((bid, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">{bid.recycler_name}</span>
                    <span className="text-[10px] text-slate-400">{bid.distance_km} km away • Free pickup</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">₹{bid.offer_rate_per_kg}/kg</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bid.status_label === 'GOOD OFFER' ? 'bg-emerald-500/20 text-emerald-300' :
                      bid.status_label === 'FAIR' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {bid.status_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTab('recyclers')}
              className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1"
            >
              <span>Proceed to Match Recyclers</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SMART RECYCLER MATCHING & LOT CREATION */}
      {tab === 'recyclers' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="font-display font-bold text-base sm:text-lg text-white mb-1">
              Authorized Recycler Matching
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              CPCB verified formal recyclers sorted by distance and offered scrap rate.
            </p>

            <div className="space-y-3">
              {(recyclers.length > 0 ? recyclers : [
                { id: 1, facility_name: "GreenCycle E-Waste Tech", authorization_no: "CPCB/AUTH/TS/2026/001", distance_km: 4.2, offered_price_per_kg: 465, rating: 4.9 },
                { id: 2, facility_name: "EcoFormal Recovery India", authorization_no: "CPCB/AUTH/TS/2026/002", distance_km: 7.5, offered_price_per_kg: 450, rating: 4.8 },
                { id: 3, facility_name: "Bharat Circular Refiners", authorization_no: "CPCB/AUTH/TS/2026/003", distance_km: 11.0, offered_price_per_kg: 445, rating: 4.7 }
              ]).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecycler(rec)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedRecycler?.id === rec.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{rec.facility_name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ AUTHORIZED
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span>📍 {rec.distance_km} km</span>
                      <span>•</span>
                      <span>Auth #{rec.authorization_no}</span>
                      <span>•</span>
                      <span className="text-amber-400">★ {rec.rating}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400 block">₹{rec.offered_price_per_kg}/kg</span>
                    <span className="text-[11px] text-slate-400">Pickup Available</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Lot Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <button
                onClick={handleCreateLot}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition"
              >
                <QrCode className="w-5 h-5" />
                <span>
                  {isOffline ? 'Save Draft Lot (Offline)' : `Create Traceable Lot with ${selectedRecycler?.facility_name || 'Recycler'}`}
                </span>
              </button>

              {statusMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {statusMsg}
                </div>
              )}
            </div>
          </div>

          {/* Generated Lot QR Showcase Card */}
          {createdLot && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500 bg-slate-900/90 text-center space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>E-Waste Lot Created & Registered</span>
              </div>

              <h4 className="font-display text-2xl font-black tracking-tight text-white">
                TRACE ID: <span className="text-emerald-400">{createdLot.trace_id}</span>
              </h4>

              <div className="w-48 h-48 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                {createdLot.qr_code_url ? (
                  <img src={createdLot.qr_code_url} alt="Trace QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-900">
                    <QrCode className="w-28 h-28 text-emerald-800" />
                    <span className="text-[10px] font-bold mt-1">Scan for Provenance</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Authorized logistics partner will scan this QR upon pickup to confirm certified digital scale weight.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PICTORIAL SAFETY GUIDELINES */}
      {tab === 'safety' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="font-display font-bold text-base sm:text-lg text-white mb-1 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Kabadiwala Environmental & Safety Guidelines</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Follow these safe handling practices to protect your health and get top rates from authorized refiners.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {safetyGuides.map((guide) => (
                <div key={guide.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400">
                    <Flame className="w-4 h-4" />
                    <h5 className="font-bold text-sm text-white">{guide.title}</h5>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{guide.danger_description}</p>
                  
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">SAFE PRACTICE:</span>
                    <p className="text-xs text-slate-400">{guide.safe_practice_description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
