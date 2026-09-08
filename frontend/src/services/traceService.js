import apiClient from './apiClient';

export const traceService = {
  getTrace: async (traceId) => {
    const res = await apiClient.get(`/trace/${traceId}`);
    return res.data;
  },
};

export default traceService;
