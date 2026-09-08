import apiClient from './apiClient';

export const lotService = {
  createLot: async (lotData) => {
    const res = await apiClient.post('/lots', lotData);
    return res.data;
  },

  listLots: async (params = {}) => {
    const res = await apiClient.get('/lots', { params });
    return res.data;
  },

  getLot: async (id) => {
    const res = await apiClient.get(`/lots/${id}`);
    return res.data;
  },

  updateLot: async (id, data) => {
    const res = await apiClient.patch(`/lots/${id}`, data);
    return res.data;
  },
};

export default lotService;
