import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recyclink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const classifyMaterial = async (data) => {
  const res = await api.post('/ai/classify-material', data);
  return res.data;
};

export const estimatePrice = async (data) => {
  const res = await api.post('/pricing/estimate', data);
  return res.data;
};

export const getRecommendedRecyclers = async (params) => {
  const res = await api.get('/recyclers/recommended', { params });
  return res.data;
};

export const createLot = async (lotData) => {
  const res = await api.post('/lots', lotData);
  return res.data;
};

export const getLot = async (id) => {
  const res = await api.get(`/lots/${id}`);
  return res.data;
};

export const listLots = async (params) => {
  const res = await api.get('/lots', { params });
  return res.data;
};

export const createTransaction = async (txData) => {
  const res = await api.post('/transactions', txData);
  return res.data;
};

export const listTransactions = async (params) => {
  const res = await api.get('/transactions', { params });
  return res.data;
};

export const updateTransactionStatus = async (id, status) => {
  const res = await api.patch(`/transactions/${id}/status`, null, { params: { new_status: status } });
  return res.data;
};

export const confirmHandover = async (id, handoverData) => {
  const res = await api.post(`/transactions/${id}/handover`, handoverData);
  return res.data;
};

export const getTraceProvenance = async (traceId) => {
  const res = await api.get(`/trace/${traceId}`);
  return res.data;
};

export const getTraceEvents = async (traceId) => {
  const res = await api.get(`/trace/${traceId}/events`);
  return res.data;
};

export const getTraceIntegrity = async (traceId) => {
  const res = await api.get(`/trace/${traceId}/integrity`);
  return res.data;
};

export const submitHandover = async (handoverData) => {
  const res = await api.post('/handover', handoverData);
  return res.data;
};

export const getHandoverReceipt = async (handoverId) => {
  const res = await api.get(`/handover/${handoverId}`);
  return res.data;
};

export const getAdminTraceAnalytics = async () => {
  const res = await api.get('/trace/admin/analytics');
  return res.data;
};

export const getAdminTraceList = async (params) => {
  const res = await api.get('/trace/admin/list', { params });
  return res.data;
};

export const getCollectorDashboard = async () => {
  const res = await api.get('/collector/dashboard');
  return res.data;
};

export const getAdminDashboard = async (params) => {
  const res = await api.get('/admin/dashboard', { params });
  return res.data;
};

export const getAdminAnalytics = async (params) => {
  const res = await api.get('/admin/analytics', { params });
  return res.data;
};

export const getAdminHotspots = async () => {
  const res = await api.get('/admin/hotspots');
  return res.data;
};

export const getAdminAnomalies = async (params) => {
  const res = await api.get('/admin/anomalies', { params });
  return res.data;
};

export const updateAdminAnomalyStatus = async (alertId, newStatus, notes = '') => {
  const res = await api.patch(`/admin/anomalies/${alertId}/status`, { new_status: newStatus, notes });
  return res.data;
};

export const getAdminFormalizationFunnel = async (params) => {
  const res = await api.get('/admin/analytics/formalization', { params });
  return res.data;
};

export const getAdminCollectorImpact = async (params) => {
  const res = await api.get('/admin/analytics/collectors', { params });
  return res.data;
};

export const getAdminPriceFairness = async (params) => {
  const res = await api.get('/admin/analytics/pricing', { params });
  return res.data;
};

export const getAdminRecyclerPerformance = async (params) => {
  const res = await api.get('/admin/analytics/recyclers', { params });
  return res.data;
};

export const getAdminTransactionPipeline = async (params) => {
  const res = await api.get('/admin/analytics/transactions', { params });
  return res.data;
};

export const getAdminTraceabilityMetrics = async (params) => {
  const res = await api.get('/admin/analytics/traceability', { params });
  return res.data;
};

export const getAdminAIMetrics = async () => {
  const res = await api.get('/admin/analytics/ai');
  return res.data;
};

export const getAdminSafetyMetrics = async () => {
  const res = await api.get('/admin/analytics/safety');
  return res.data;
};

export const getAdminImpactScorecard = async (params) => {
  const res = await api.get('/admin/analytics/scorecard', { params });
  return res.data;
};

export const getAdminAttentionItems = async () => {
  const res = await api.get('/admin/analytics/attention');
  return res.data;
};

export const getAdminInsights = async () => {
  const res = await api.get('/admin/analytics/insights');
  return res.data;
};

export const getAdminTransactions = async (params) => {
  const res = await api.get('/admin/transactions', { params });
  return res.data;
};

export const getAdminRecyclers = async (params) => {
  const res = await api.get('/admin/recyclers', { params });
  return res.data;
};

export const getAdminCollectors = async (params) => {
  const res = await api.get('/admin/collectors', { params });
  return res.data;
};

export const getAdminMaterials = async () => {
  const res = await api.get('/admin/materials');
  return res.data;
};

export const getAdminAuditLogs = async (limit = 50) => {
  const res = await api.get('/admin/audit-logs', { params: { limit } });
  return res.data;
};

export const searchAdmin = async (q) => {
  const res = await api.get('/admin/search', { params: { q } });
  return res.data;
};

export const getSafetyGuides = async (lang = 'en') => {
  const res = await api.get('/safety-guides', { params: { lang } });
  return res.data;
};

// Recycler Operations Portal APIs
export const getRecyclerDashboard = async () => {
  const res = await api.get('/recycler/dashboard');
  return res.data;
};

export const getIncomingLots = async (params) => {
  const res = await api.get('/recycler/lots/incoming', { params });
  return res.data;
};

export const getRecyclerLotDetail = async (id) => {
  const res = await api.get(`/recycler/lots/${id}`);
  return res.data;
};

export const listRecyclerOffers = async () => {
  const res = await api.get('/recycler/offers');
  return res.data;
};

export const submitRecyclerOffer = async (offerData) => {
  const res = await api.post('/recycler/offers', offerData);
  return res.data;
};

export const updateRecyclerOffer = async (id, offerData) => {
  const res = await api.patch(`/recycler/offers/${id}`, offerData);
  return res.data;
};

export const acceptRecyclerLot = async (id) => {
  const res = await api.post(`/recycler/lots/${id}/accept`);
  return res.data;
};

export const rejectRecyclerLot = async (id) => {
  const res = await api.post(`/recycler/lots/${id}/reject`);
  return res.data;
};

export const listRecyclerPickups = async () => {
  const res = await api.get('/recycler/pickups');
  return res.data;
};

export const scheduleRecyclerPickup = async (pickupData) => {
  const res = await api.post('/recycler/pickups', pickupData);
  return res.data;
};

export const updateRecyclerPickupStatus = async (id, statusData) => {
  const res = await api.patch(`/recycler/pickups/${id}/status`, statusData);
  return res.data;
};

export const getHandoverVerifyDetails = async (txnId) => {
  const res = await api.get(`/recycler/handover/${txnId}`);
  return res.data;
};

export const submitHandoverVerification = async (txnId, handoverData) => {
  const res = await api.post(`/recycler/handover/${txnId}`, handoverData);
  return res.data;
};

export const listRecyclerTransactions = async (params) => {
  const res = await api.get('/recycler/transactions', { params });
  return res.data;
};

export const getRecyclerTransactionDetail = async (id) => {
  const res = await api.get(`/recycler/transactions/${id}`);
  return res.data;
};

export const updateRecyclerPaymentStatus = async (id, paymentData) => {
  const res = await api.patch(`/recycler/transactions/${id}/payment-status`, paymentData);
  return res.data;
};

export const getRecyclerProfile = async () => {
  const res = await api.get('/recycler/profile');
  return res.data;
};

export const updateRecyclerProfile = async (profileData) => {
  const res = await api.patch('/recycler/profile', profileData);
  return res.data;
};

// Admin Settings
export const getAdminSettings = async () => {
  const res = await api.get('/admin/settings');
  return res.data;
};

export const updateAdminSettings = async (settingsData) => {
  const res = await api.post('/admin/settings', settingsData);
  return res.data;
};

// ==========================================
// Phase 11: Circular Economy Intelligence APIs
// ==========================================

export const getIntelligenceOverview = async () => {
  const res = await api.get('/intelligence/overview');
  return res.data;
};

export const getIntelligenceTrends = async () => {
  const res = await api.get('/intelligence/trends');
  return res.data;
};

export const getIntelligenceForecast = async () => {
  const res = await api.get('/intelligence/forecast');
  return res.data;
};

export const getIntelligenceBottlenecks = async () => {
  const res = await api.get('/intelligence/bottlenecks');
  return res.data;
};

export const getIntelligenceRecommendations = async (params) => {
  const res = await api.get('/intelligence/recommendations', { params });
  return res.data;
};

export const actOnRecommendation = async (recId, actionData) => {
  const res = await api.post(`/intelligence/recommendations/${recId}/action`, actionData);
  return res.data;
};

export const getIntelligenceDecisions = async () => {
  const res = await api.get('/intelligence/decisions');
  return res.data;
};

export const getIntelligenceOpportunities = async () => {
  const res = await api.get('/intelligence/opportunities');
  return res.data;
};

export const getRecyclerNetworkCapacity = async () => {
  const res = await api.get('/intelligence/recycler-network');
  return res.data;
};

export const getAIPerformanceAnalytics = async () => {
  const res = await api.get('/intelligence/ai-performance');
  return res.data;
};

export const queryDecisionSupport = async (queryText) => {
  const res = await api.post('/intelligence/decision-support', { query: queryText });
  return res.data;
};

export const getIntelligenceTraceAlerts = async (params) => {
  const res = await api.get('/intelligence/trace-alerts', { params });
  return res.data;
};

export const resolveTraceAlert = async (alertId, actionData) => {
  const res = await api.post(`/intelligence/trace-alerts/${alertId}/action`, actionData);
  return res.data;
};

export const runScenarioSimulation = async (scenarioType, parameterChangePct = 25.0) => {
  const res = await api.post('/intelligence/simulations', {
    scenario_type: scenarioType,
    parameter_change_pct: parameterChangePct
  });
  return res.data;
};

export const getCollectorInsights = async (collectorId) => {
  const res = await api.get('/intelligence/collector-insights', {
    params: collectorId ? { collector_id: collectorId } : {}
  });
  return res.data;
};

export default api;

