import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Truck, Calendar, Clock, MapPin, Scale, CheckCircle2, 
  AlertCircle, RefreshCw, ChevronRight, Play, Check, X
} from 'lucide-react';
import { 
  listRecyclerPickups, updateRecyclerPickupStatus, 
  listRecyclerTransactions, scheduleRecyclerPickup 
} from '../../services/api';

export default function RecyclerPickups() {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState({ today: [], upcoming: [], completed: [] });
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Schedule Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [acceptedTxns, setAcceptedTxns] = useState([]);
  const [selectedTxnId, setSelectedTxnId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('10:00 AM - 01:00 PM');
  const [notes, setNotes] = useState('');
  const [submittingSched, setSubmittingSched] = useState(false);

  const fetchPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRecyclerPickups();
      setPickups(data);
    } catch (err) {
      console.error('Failed to load pickups:', err);
      setError(err.response?.data?.detail || 'Failed to load pickup logistics.');
    } finally {
      setLoading(false);
    }
  };

  const loadAcceptedForModal = async () => {
    try {
      const txns = await listRecyclerTransactions({ status: 'ACCEPTED' });
      setAcceptedTxns(txns);
      if (txns.length > 0) setSelectedTxnId(txns[0].id);
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setSchedDate(tmrw.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error loading accepted txns:', err);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleStatusChange = async (pickupId, newStatus, txnId) => {
    setActionMsg('');
    setError('');
    try {
      await updateRecyclerPickupStatus(pickupId, { status: newStatus });
      setActionMsg(`✓ Pickup marked as ${newStatus}`);
      await fetchPickups();
      if (newStatus === 'ARRIVED') {
        navigate(`/recycler/handover?txn=${txnId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to update pickup status.');
    }
  };

  const handleOpenScheduleModal = () => {
    loadAcceptedForModal();
    setModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTxnId || !schedDate) return;
    setSubmittingSched(true);
    try {
      await scheduleRecyclerPickup({
        transaction_id: parseInt(selectedTxnId),
        scheduled_date: new Date(schedDate).toISOString(),
        time_window: timeWindow,
        pickup_notes: notes
      });
      setActionMsg('✓ Logistics pickup successfully scheduled!');
      setModalOpen(false);
      await fetchPickups();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to schedule pickup.');
    } finally {
      setSubmittingSched(false);
    }
  };

  const currentList = pickups[activeTab] || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            <span>Logistics & Transport Pickup Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate dispatch, onsite driver arrival, and digital custody handover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPickups}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={handleOpenScheduleModal}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5"
          >
            <span>+ Schedule Pickup</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs Navigation (Section 16) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'today'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>Today's Pickups</span>
          <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {pickups.today.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>Upcoming Pickups</span>
          <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {pickups.upcoming.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>Completed Pickups</span>
          <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {pickups.completed.length}
          </span>
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading logistics schedule...</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Truck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Pickups in this Category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'today'
              ? 'No logistics pickups are queued for today.'
              : 'Schedule pickup transport for any of your accepted collector lots.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                      {p.lot_code || `TXN-${p.transaction_id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                      p.status === 'ARRIVED' ? 'bg-purple-500/20 text-purple-300' :
                      p.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white">
                    {p.material_name || 'E-Waste Lot'}
                  </h3>
                  <span className="text-xs text-slate-400 block mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {p.collector_area || 'Collector Location'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Estimated Weight</span>
                  <span className="text-base font-bold text-white font-mono">{p.weight_kg || 2.4} kg</span>
                </div>
              </div>

              {/* Date & Window Matrix */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Date</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(p.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Time Window</span>
                    <span className="font-semibold text-slate-200">{p.time_window}</span>
                  </div>
                </div>
              </div>

              {p.pickup_notes && (
                <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg">
                  "{p.pickup_notes}"
                </p>
              )}

              {/* Action Buttons (Section 17: SCHEDULED -> IN_PROGRESS -> ARRIVED -> HANDOVER) */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800">
                {p.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'IN_PROGRESS', p.transaction_id)}
                    className="py-1.5 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Pickup</span>
                  </button>
                )}

                {p.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'ARRIVED', p.transaction_id)}
                    className="py-1.5 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Arrived Onsite</span>
                  </button>
                )}

                {p.status !== 'COMPLETED' && (
                  <button
                    onClick={() => navigate(`/recycler/handover?txn=${p.transaction_id}`)}
                    className="py-1.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Verify Handover</span>
                  </button>
                )}

                {p.status === 'COMPLETED' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Handover Verified</span>
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>Schedule Logistics Dispatch</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {acceptedTxns.length === 0 ? (
              <div className="text-center py-6 space-y-2 text-xs text-slate-400">
                <p>No accepted lots are currently awaiting pickup scheduling.</p>
                <Link to="/recycler/incoming" className="text-emerald-400 font-semibold hover:underline block">
                  Review incoming lots to accept new lots
                </Link>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Accepted Lot
                  </label>
                  <select
                    value={selectedTxnId}
                    onChange={(e) => setSelectedTxnId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {acceptedTxns.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.lot_id} — {t.material} ({t.weight_kg} kg) • {t.collector_area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Time Window
                  </label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                    <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Driver / Fleet Instructions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Carry calibrated digital platform scale and anti-static ESD bags..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSched}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow disabled:opacity-50"
                  >
                    {submittingSched ? 'Saving...' : 'Confirm Schedule'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
