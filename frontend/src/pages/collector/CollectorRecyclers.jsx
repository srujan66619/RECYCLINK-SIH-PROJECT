import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Truck, Star, ArrowRight, Filter, Award, Table, LayoutList } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import recyclerService from '../../services/recyclerService';
import { LoadingSpinner, ErrorCard } from '../../components/common/StateViews';
import {
  RecyclerOfferCard,
  RecyclerComparison,
  PriceAnomalyAlert
} from '../../components/pricing';

export default function CollectorRecyclers() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const material = state.material || 'Printed Circuit Board (PCB)';
  const materialId = state.material_id || null;
  const weight = state.weight_kg || 2.4;
  const condition = state.condition || 'Standard Scrap';
  const photoUrl = state.photo_url;
  const recommendedPrice = state.recommended_price || 455.0;
  const marketMin = state.market_min || 390.0;
  const marketMax = state.market_max || 480.0;

  const [recyclers, setRecyclers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('best_match');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedRecyclerId, setSelectedRecyclerId] = useState(null);

  const fetchRecyclers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recyclerService.getRecommended({
        material,
        material_id: materialId,
        weight,
        condition,
        lat: 17.385,
        lon: 78.486,
        city: 'Hyderabad'
      });
      setRecyclers(data);
      if (data && data.length > 0) {
        setSelectedRecyclerId(data[0].id || data[0].recycler_id);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to fetch authorized recyclers.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecyclers();
  }, [material, weight, condition]);

  if (loading) {
    return <LoadingSpinner message="Locating CPCB-authorized demo recyclers near you..." />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={fetchRecyclers} />;
  }

  // Filter & sort logic
  const getFilteredRecyclers = () => {
    let list = [...recyclers];
    if (activeFilter === 'nearest') {
      list.sort((a, b) => a.distance_km - b.distance_km);
    } else if (activeFilter === 'best_price') {
      list.sort((a, b) => (b.offered_price_per_kg || b.offer_price || 0) - (a.offered_price_per_kg || a.offer_price || 0));
    } else if (activeFilter === 'pickup') {
      list = list.filter((r) => r.pickup_available);
    } else if (activeFilter === 'verified') {
      list = list.filter((r) => (r.authorization_status || '').includes('VERIFIED'));
    } else {
      // Default: best_match (by overall_score)
      list.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
    }
    return list;
  };

  const filteredList = getFilteredRecyclers();
  const selectedRecycler = recyclers.find(r => (r.id || r.recycler_id) === selectedRecyclerId) || filteredList[0];

  // Anomaly check: if selected offer rate is >30% below benchmark
  const selectedRate = selectedRecycler?.offered_price_per_kg || selectedRecycler?.offer_price || recommendedPrice;
  const isPredatory = selectedRate < (recommendedPrice * 0.70);
  const predatoryDiffPct = roundNum(((selectedRate - recommendedPrice) / recommendedPrice) * 100);

  function roundNum(val) {
    return Math.round(val * 10) / 10;
  }

  const handleSelectRecycler = (recycler) => {
    const rate = recycler.offered_price_per_kg || recycler.offer_price || recommendedPrice;
    navigate('/collector/create-lot', {
      state: {
        material,
        material_id: materialId,
        weight_kg: weight,
        condition,
        photo_url: photoUrl,
        recommended_price: recommendedPrice,
        market_min: marketMin,
        market_max: marketMax,
        recycler,
        agreed_rate: rate,
        total_amount: Math.round(rate * weight),
      },
    });
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
          SMART RECYCLER MATCHING
        </span>
        <h2 className="text-xl font-black text-white tracking-tight">
          Select Authorized Recycler
        </h2>
        <p className="text-xs text-slate-400">
          Ranked by state PCB authorization, proximity, competitive bid rates, and verified reliability.
        </p>
      </div>

      {/* Filter Tabs & View Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setActiveFilter('best_match')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeFilter === 'best_match'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Best Match
          </button>
          <button
            onClick={() => setActiveFilter('best_price')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeFilter === 'best_price'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Highest Price
          </button>
          <button
            onClick={() => setActiveFilter('nearest')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeFilter === 'nearest'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Nearest
          </button>
          <button
            onClick={() => setActiveFilter('pickup')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeFilter === 'pickup'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Pickup Available
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            title="Card View"
            className={`p-1.5 rounded-lg ${viewMode === 'cards' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Comparison Table"
            className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Anomaly Warning Banner if Selected Offer is Suspicious */}
      {isPredatory && (
        <PriceAnomalyAlert
          expectedRange={`₹${marketMin} – ₹${marketMax}`}
          offeredPrice={selectedRate}
          differencePercent={predatoryDiffPct}
          severity="HIGH"
          reason="The selected dismantler offer is significantly lower than the estimated regional fair-price range."
          onReviewOthers={() => {
            const best = filteredList.find(r => (r.offered_price_per_kg || r.offer_price) >= recommendedPrice);
            if (best) setSelectedRecyclerId(best.id || best.recycler_id);
          }}
        />
      )}

      {/* View Mode: Comparison Table */}
      {viewMode === 'table' && (
        <RecyclerComparison
          offers={filteredList}
          fairRange={`₹${marketMin} – ₹${marketMax}`}
          bestMatchName={filteredList[0]?.facility_name}
          onSelectRecycler={(rec) => {
            setSelectedRecyclerId(rec.id || rec.recycler_id);
            handleSelectRecycler(rec);
          }}
        />
      )}

      {/* View Mode: Recommender Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredList.map((recycler, index) => {
            const rId = recycler.id || recycler.recycler_id;
            const isSelected = rId === selectedRecyclerId;
            const isBest = index === 0 && activeFilter === 'best_match';

            return (
              <RecyclerOfferCard
                key={rId}
                recycler={recycler}
                weight={weight}
                isBestMatch={isBest}
                selected={isSelected}
                onSelect={() => {
                  setSelectedRecyclerId(rId);
                  handleSelectRecycler(recycler);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
