import apiClient from './apiClient';

export const collectorService = {
  getDashboard: async () => {
    const res = await apiClient.get('/collector/dashboard');
    return res.data;
  },

  getLots: async () => {
    const res = await apiClient.get('/collector/lots');
    return res.data;
  },

  getTransactions: async () => {
    const res = await apiClient.get('/collector/transactions');
    return res.data;
  },

  getEarnings: async () => {
    const res = await apiClient.get('/collector/earnings');
    return res.data;
  }
};

export default collectorService;
