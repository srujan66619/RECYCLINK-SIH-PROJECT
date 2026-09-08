import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, MapPin, Phone, Mail, 
  Check, Save, RefreshCw, AlertCircle, Sparkles, CheckCircle2 
} from 'lucide-react';
import { getRecyclerProfile, updateRecyclerProfile } from '../../services/api';

export default function RecyclerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [facilityName, setFacilityName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceRadius, setServiceRadius] = useState(30);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [acceptedMaterials, setAcceptedMaterials] = useState([]);

  const allMaterials = ['PCB', 'Cable', 'Battery', 'LCD', 'CRT', 'Motor', 'Electronic Component', 'Mixed Plastic'];

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecyclerProfile();
      setProfile(data);
      setFacilityName(data.facility_name || '');
      setContactPhone(data.contact_phone || '');
      setContactEmail(data.contact_email || '');
      setAddress(data.address || '');
      setServiceRadius(data.service_radius_km || 30);
      setPickupAvailable(data.pickup_available ?? true);
      setAcceptedMaterials(data.accepted_materials || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Unable to fetch recycler profile configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleMaterial = (mat) => {
    if (acceptedMaterials.includes(mat)) {
      setAcceptedMaterials(acceptedMaterials.filter(m => m !== mat));
    } else {
      setAcceptedMaterials([...acceptedMaterials, mat]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');
    try {
      const payload = {
        facility_name: facilityName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        address: address,
        service_radius_km: parseFloat(serviceRadius),
        pickup_available: pickupAvailable,
        accepted_materials: acceptedMaterials
      };
      const updated = await updateRecyclerProfile(payload);
      setProfile(updated);
      setSuccessMsg('✓ Facility profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400">Loading facility authorization profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>Recycling Facility Profile & Capabilities</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            CPCB registration, authorized scrap categories, and logistics radius settings.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Authorization Badge Card (Section 26) */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {profile?.badge || '✓ VERIFIED DEMO RECYCLER'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              License: {profile?.authorization_number}
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-white">
            {profile?.facility_name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Operating in {profile?.city}, {profile?.state} • Reliability Rating: <span className="text-emerald-400 font-bold">{profile?.reliability_score}%</span>
          </p>
        </div>

        <div className="text-right bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-400 uppercase block">State Pollution Control</span>
          <span className="font-bold text-emerald-400 text-sm block mt-0.5">Audited & Active</span>
          <span className="text-[10px] text-slate-500">Zero Landfill Toxic Leakage</span>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          
          <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3">
            Operational Parameters & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Facility Commercial Name
              </label>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Official Facility Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Service Radius (km)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={serviceRadius}
                onChange={(e) => setServiceRadius(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Registered Plant Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 27: Accepted Materials Multi-Select */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div>
              <h4 className="font-bold text-white text-sm">
                Authorized Material Capabilities (Section 27)
              </h4>
              <p className="text-xs text-slate-400">
                You will only receive incoming e-waste lot recommendations matching these categories.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {allMaterials.map((mat) => {
                const isChecked = acceptedMaterials.includes(mat);
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleToggleMaterial(mat)}
                    className={`p-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{mat}</span>
                    {isChecked ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-700"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logistics Availability */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white block">Logistics Transport Fleet Active</span>
              <span className="text-xs text-slate-400 block">Offer door-to-door collection pickup to local informal kabadiwalas</span>
            </div>
            <button
              type="button"
              onClick={() => setPickupAvailable(!pickupAvailable)}
              className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                pickupAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white block shadow"></span>
            </button>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Configuration'}</span>
            </button>
          </div>

        </div>
      </form>

    </div>
  );
}
