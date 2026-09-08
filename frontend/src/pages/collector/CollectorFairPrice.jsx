import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import pricingService from '../../services/pricingService';
import { LoadingSpinner, ErrorCard } from '../../components/common/StateViews';
import {
  FairPriceCard,
  PriceRangeBar,
  PriceTrend,
  PriceExplanation
} from '../../components/pricing';

export default function CollectorFairPrice() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const material = state.material || 'Printed Circuit Board (PCB)';
  const materialId = state.material_id || null;
  const weight = state.weight_kg || 2.4;
  const condition = state.condition || 'Standard Scrap';
  const photoUrl = state.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80';

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pricingService.estimatePrice({
        material,
        material_id: materialId,
        weight_kg: weight,
        location_city: 'Hyderabad',
        condition,
      });
      setEstimate(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to calculate fair price estimate.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [material, weight, condition]);

  if (loading) {
    return <LoadingSpinner message="Calculating fair market baseline..." />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={fetchPricing} />;
  }

  const recRate = estimate?.recommended_fair_price_per_kg || estimate?.recommended_price || 455.0;
  const minRate = estimate?.market_range_min_per_kg || estimate?.market_min || 390.0;
  const maxRate = estimate?.market_range_max_per_kg || estimate?.market_max || 480.0;
  const totalValue = estimate?.total_estimated_value || Math.round(recRate * weight);
  const confidence = estimate?.confidence || 'HIGH';
  const confidenceScore = estimate?.confidence_score || 0.88;
  const trend = estimate?.trend || 'STABLE';
  const pctChange = estimate?.percentage_change || 0.0;
  const explanation = estimate?.explanation || null;

  const handleProceedToRecyclers = () => {
    navigate('/collector/recyclers', {
      state: {
        material,
        material_id: materialId,
        weight_kg: weight,
        condition,
        recommended_price: recRate,
        market_min: minRate,
        market_max: maxRate,
        total_estimated_value: totalValue,
        photo_url: photoUrl,
      },
    });
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
          TRANSPARENT COMMODITY INTELLIGENCE
        </span>
        <h2 className="text-xl font-black text-white tracking-tight">
          Fair Price Benchmark
        </h2>
        <p className="text-xs text-slate-400">
          CPCB-indexed baseline protecting informal collectors from predatory discounting.
        </p>
      </div>

      {/* 1. Fair Price Hero Card */}
      <FairPriceCard
        material={material}
        weight={weight}
        recommendedPrice={recRate}
        minPrice={minRate}
        maxPrice={maxRate}
        totalValue={totalValue}
        confidence={confidence}
        confidenceScore={confidenceScore}
        trend={trend}
        pctChange={pctChange}
        condition={condition}
        location="Hyderabad"
      />

      {/* 2. Visual Price Range Spectrum Bar */}
      <PriceRangeBar
        minPrice={minRate}
        maxPrice={maxRate}
        recommendedPrice={recRate}
        unit="₹/kg"
      />

      {/* 3. Historical Price Index Chart */}
      <PriceTrend
        material={material}
        materialId={materialId}
      />

      {/* 4. Transparent Calculation Explanation Panel */}
      <PriceExplanation
        explanation={explanation}
      />

      {/* 5. Primary Call to Action */}
      <div className="pt-2">
        <button
          onClick={handleProceedToRecyclers}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-[0.98]"
        >
          <span>Find Best Matching Recyclers</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
