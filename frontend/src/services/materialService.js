import apiClient from './apiClient';

export const materialService = {
  listMaterials: async (params = {}) => {
    const res = await apiClient.get('/materials', { params });
    return res.data;
  },

  getMaterial: async (id) => {
    const res = await apiClient.get(`/materials/${id}`);
    return res.data;
  }
};

export default materialService;
