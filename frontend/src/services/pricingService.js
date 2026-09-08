import apiClient from './apiClient';

export const pricingService = {
  estimatePrice: async ({ material, material_id, weight_kg, location_city = 'Hyderabad', condition = 'Standard Scrap' }) => {
    const res = await apiClient.post('/pricing/estimate', {
      material,
      material_id,
      weight_kg,
      location_city,
      condition,
    });
    return res.data;
  },

  getHistory: async (material = 'PCB', material_id = null) => {
    const res = await apiClient.get('/pricing/history', {
      params: { material, material_id },
    });
    return res.data;
  },

  getTrend: async (materialId) => {
    const res = await apiClient.get(`/pricing/trend/${materialId}`);
    return res.data;
  },
};

export default pricingService;
