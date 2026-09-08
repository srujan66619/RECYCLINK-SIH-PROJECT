import apiClient from './apiClient';

export const recyclerService = {
  getRecommended: async ({ material = 'PCB', material_id, weight = 2.4, condition = 'Standard Scrap', lat = 17.385, lon = 78.486, city = 'Hyderabad' } = {}) => {
    const res = await apiClient.get('/recyclers/recommended', {
      params: { material, material_id, weight, condition, lat, lon, city },
    });
    return res.data;
  },

  listRecyclers: async (params = {}) => {
    const res = await apiClient.get('/recyclers', { params });
    return res.data;
  },

  getRecycler: async (id) => {
    const res = await apiClient.get(`/recyclers/${id}`);
    return res.data;
  },

  getOffers: async (id) => {
    const res = await apiClient.get(`/recyclers/${id}/offers`);
    return res.data;
  },
};

export default recyclerService;
