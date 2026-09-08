import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Tag, RefreshCw, AlertCircle, ChevronRight, Scale, 
  IndianRupee, Calendar, Truck, CheckCircle2 
} from 'lucide-react';
import { listRecyclerOffers } from '../../services/api';

export default function RecyclerOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRecyclerOffers();
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError(err.response?.data?.detail || 'Failed to load offers ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-cyan-400" />
            <span>Recycler Purchase Offers & Bids</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track acquisition rates submitted to informal collectors with real-time status and audit provenance.
          </p>
        </div>

        <button
          onClick={fetchOffers}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading your purchase offers ledger...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
          {error}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Offers Submitted Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse incoming e-waste lots from local collectors and submit your formal benchmark rate.
          </p>
          <Link
            to="/recycler/incoming"
            className="inline-block py-2 px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Browse Incoming Lots
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Lot & Trace ID</th>
                  <th className="p-4">Material Grade</th>
                  <th className="p-4">Lot Weight</th>
                  <th className="p-4">Offered Rate</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Collector Area</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-bold text-white block">{offer.lot_id}</span>
                      <span className="font-mono text-[10px] text-emerald-400 block">{offer.trace_id}</span>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {offer.material}
                    </td>
                    <td className="p-4 text-slate-300">
                      {offer.weight_kg} kg
                    </td>
                    <td className="p-4 font-mono font-semibold text-cyan-400">
                      ₹{offer.agreed_rate}/kg
                    </td>
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      ₹{offer.final_price}
                    </td>
                    <td className="p-4 text-slate-400">
                      {offer.collector_area}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        offer.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        offer.status === 'ACCEPTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        offer.status === 'PICKUP_SCHEDULED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {offer.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/recycler/lots/${offer.lot_id}`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
                      >
                        Review Lot
                      </button>

                      {offer.status === 'ACCEPTED' && (
                        <button
                          onClick={() => navigate('/recycler/pickups')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                        >
                          Dispatch Pickup
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
