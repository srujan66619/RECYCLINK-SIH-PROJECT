import React from 'react';
import { Loader2, AlertTriangle, PackageX, RefreshCw } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
      <p className="text-slate-300 font-medium text-sm">{message}</p>
    </div>
  );
}

export function ErrorCard({ message = 'Unable to connect to service.', onRetry }) {
  return (
    <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-5 my-4 text-center">
      <div className="inline-flex p-3 bg-red-900/30 rounded-full text-red-400 mb-2">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-red-200 font-semibold text-base mb-1">Connection Error</h4>
      <p className="text-red-300/80 text-sm mb-4 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No records found', message, actionLabel, onAction, icon: Icon = PackageX }) {
  return (
    <div className="border border-dashed border-slate-800 rounded-2xl p-8 my-6 text-center bg-slate-900/30">
      <div className="inline-flex p-4 bg-slate-800/60 rounded-full text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-slate-200 font-semibold text-base mb-1">{title}</h4>
      {message && <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
