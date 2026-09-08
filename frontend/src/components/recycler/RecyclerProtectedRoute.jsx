import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';

export default function RecyclerProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Verifying Recycler Authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/recycler/login" state={{ from: location }} replace />;
  }

  // Section 4: If a collector or unauthorized user tries to access recycler routes -> 403 Forbidden
  if (user.role !== 'RECYCLER') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              403 Forbidden
            </span>
            <h2 className="text-xl font-bold text-white mt-2">
              Recycler Portal Access Restricted
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              You are currently logged in as <span className="font-bold text-slate-200">{user.full_name} ({user.role})</span>. This portal is reserved strictly for CPCB-authorized e-waste recycling facilities.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/collector/dashboard"
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition text-center"
            >
              Go to Collector Portal
            </Link>
            <Link
              to="/recycler/login"
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition text-center flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Switch to Recycler Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
