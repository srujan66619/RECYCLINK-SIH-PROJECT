import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import RecyclerPortal from './pages/RecyclerPortal';
import TraceExplorer from './pages/TraceExplorer';
import AdminDashboard from './pages/AdminDashboard';
import DemoTourModal from './components/DemoTourModal';
import { offlineSyncManager } from './services/offlineSync';

// Collector Experience Components
import ProtectedRoute from './components/collector/ProtectedRoute';
import CollectorLayout from './components/collector/CollectorLayout';
import CollectorLogin from './pages/collector/CollectorLogin';
import CollectorRegister from './pages/collector/CollectorRegister';
import CollectorDashboard from './pages/collector/CollectorDashboard';
import CollectorIdentify from './pages/collector/CollectorIdentify';
import CollectorMaterialResult from './pages/collector/CollectorMaterialResult';
import CollectorFairPrice from './pages/collector/CollectorFairPrice';
import CollectorRecyclers from './pages/collector/CollectorRecyclers';
import CollectorCreateLot from './pages/collector/CollectorCreateLot';
import CollectorLotSuccess from './pages/collector/CollectorLotSuccess';
import CollectorLots from './pages/collector/CollectorLots';
import CollectorLotDetail from './pages/collector/CollectorLotDetail';
import CollectorEarnings from './pages/collector/CollectorEarnings';
import CollectorSafety from './pages/collector/CollectorSafety';
import CollectorProfile from './pages/collector/CollectorProfile';

// Recycler Operations Experience Components (Phase 6)
import RecyclerProtectedRoute from './components/recycler/RecyclerProtectedRoute';
import RecyclerLayout from './components/recycler/RecyclerLayout';
import RecyclerLogin from './pages/recycler/RecyclerLogin';
import RecyclerDashboard from './pages/recycler/RecyclerDashboard';
import RecyclerIncomingLots from './pages/recycler/RecyclerIncomingLots';
import RecyclerLotDetail from './pages/recycler/RecyclerLotDetail';
import RecyclerOffers from './pages/recycler/RecyclerOffers';
import RecyclerPickups from './pages/recycler/RecyclerPickups';
import RecyclerHandover from './pages/recycler/RecyclerHandover';
import RecyclerTransactions from './pages/recycler/RecyclerTransactions';
import RecyclerProfile from './pages/recycler/RecyclerProfile';
import RecyclerScanQR from './pages/recycler/RecyclerScanQR';

// Circular Trace Components (Phase 7)
import CollectorTraceQR from './pages/collector/CollectorTraceQR';
import AdminTraceView from './pages/admin/AdminTraceView';

// Admin / Government Impact Intelligence Components (Phase 8)
import AdminLayout from './components/admin/AdminLayout';
import AdminAnalyticsView from './pages/admin/AdminAnalyticsView';
import AdminAnomaliesView from './pages/admin/AdminAnomaliesView';
import AdminTransactionsView from './pages/admin/AdminTransactionsView';
import AdminRecyclersView from './pages/admin/AdminRecyclersView';
import AdminCollectorsView from './pages/admin/AdminCollectorsView';
import AdminMaterialsView from './pages/admin/AdminMaterialsView';
import AdminReportsView from './pages/admin/AdminReportsView';
import AdminAuditLogsView from './pages/admin/AdminAuditLogsView';
import AdminSettingsView from './pages/admin/AdminSettingsView';

// Phase 10: Grand Finale National Intelligence & Digital Passport
import DigitalMaterialPassport from './pages/DigitalMaterialPassport';
import CircularFlowView from './pages/admin/CircularFlowView';
import AdminDemoControlView from './pages/admin/AdminDemoControlView';

// Trace wrapper to consume :traceId param
function TraceExplorerRoute() {
  const { traceId } = useParams();
  return <TraceExplorer initialTraceId={traceId || 'RC-2026-000001'} />;
}

// Landing Layout with Top Navbar and Demo Modal
function PublicPortalLayout({ children, activeView = 'landing' }) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      const res = await offlineSyncManager.syncPending();
      if (res.synced > 0) {
        console.log(`Auto-synced ${res.synced} offline drafts to RECYCLINK!`);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeView={activeView}
        onStartDemo={() => setIsDemoOpen(true)}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
      />
      <main className="flex-1">
        {children}
      </main>
      <DemoTourModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route 
              path="/" 
              element={
                <PublicPortalLayout activeView="landing">
                  <LandingHero />
                </PublicPortalLayout>
              } 
            />

            {/* Recycler Authentication */}
            <Route path="/recycler/login" element={<RecyclerLogin />} />

            {/* Recycler Protected Operations Workspace (Phase 6 & 7) */}
            <Route 
              path="/recycler" 
              element={
                <RecyclerProtectedRoute>
                  <RecyclerLayout />
                </RecyclerProtectedRoute>
              } 
            >
              <Route index element={<Navigate to="/recycler/dashboard" replace />} />
              <Route path="dashboard" element={<RecyclerDashboard />} />
              <Route path="incoming" element={<RecyclerIncomingLots />} />
              <Route path="lots/:id" element={<RecyclerLotDetail />} />
              <Route path="offers" element={<RecyclerOffers />} />
              <Route path="pickups" element={<RecyclerPickups />} />
              <Route path="scan" element={<RecyclerScanQR />} />
              <Route path="handover" element={<RecyclerHandover />} />
              <Route path="handover/:lotId" element={<RecyclerHandover />} />
              <Route path="transactions" element={<RecyclerTransactions />} />
              <Route path="transactions/:id" element={<RecyclerTransactions />} />
              <Route path="profile" element={<RecyclerProfile />} />
            </Route>

            {/* Traceability Explorer */}
            <Route 
              path="/trace" 
              element={
                <PublicPortalLayout activeView="trace">
                  <TraceExplorerRoute />
                </PublicPortalLayout>
              } 
            />
            <Route 
              path="/trace/:traceId" 
              element={
                <PublicPortalLayout activeView="trace">
                  <TraceExplorerRoute />
                </PublicPortalLayout>
              } 
            />

            {/* Digital Material Passport (Phase 10) */}
            <Route 
              path="/passport" 
              element={
                <PublicPortalLayout activeView="passport">
                  <DigitalMaterialPassport />
                </PublicPortalLayout>
              } 
            />
            <Route 
              path="/passport/:traceId" 
              element={
                <PublicPortalLayout activeView="passport">
                  <DigitalMaterialPassport />
                </PublicPortalLayout>
              } 
            />

            {/* Admin / CPCB Government Intelligence Workspace (Phase 8) */}
            <Route 
              path="/admin" 
              element={
                <PublicPortalLayout activeView="admin">
                  <AdminLayout />
                </PublicPortalLayout>
              } 
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalyticsView />} />
              <Route path="trace" element={<AdminTraceView />} />
              <Route path="transactions" element={<AdminTransactionsView />} />
              <Route path="recyclers" element={<AdminRecyclersView />} />
              <Route path="collectors" element={<AdminCollectorsView />} />
              <Route path="materials" element={<AdminMaterialsView />} />
              <Route path="anomalies" element={<AdminAnomaliesView />} />
              <Route path="reports" element={<AdminReportsView />} />
              <Route path="audit-logs" element={<AdminAuditLogsView />} />
              <Route path="settings" element={<AdminSettingsView />} />
              <Route path="circular-flow" element={<CircularFlowView />} />
              <Route path="demo" element={<AdminDemoControlView />} />
            </Route>

            {/* Collector Authentication */}
            <Route path="/collector/login" element={<CollectorLogin />} />
            <Route path="/collector/register" element={<CollectorRegister />} />

            {/* Collector Protected Mobile-First Web App */}
            <Route 
              path="/collector" 
              element={
                <ProtectedRoute>
                  <CollectorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/collector/dashboard" replace />} />
              <Route path="dashboard" element={<CollectorDashboard />} />
              <Route path="identify" element={<CollectorIdentify />} />
              <Route path="material-result" element={<CollectorMaterialResult />} />
              <Route path="fair-price" element={<CollectorFairPrice />} />
              <Route path="recyclers" element={<CollectorRecyclers />} />
              <Route path="choose-recycler" element={<CollectorRecyclers />} />
              <Route path="create-lot" element={<CollectorCreateLot />} />
              <Route path="lot-success" element={<CollectorLotSuccess />} />
              <Route path="lots" element={<CollectorLots />} />
              <Route path="lots/:id" element={<CollectorLotDetail />} />
              <Route path="trace/:traceId" element={<CollectorTraceQR />} />
              <Route path="earnings" element={<CollectorEarnings />} />
              <Route path="safety" element={<CollectorSafety />} />
              <Route path="profile" element={<CollectorProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </AuthProvider>
  );
}
