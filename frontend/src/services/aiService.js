import apiClient from './apiClient';

export const aiService = {
  classifyMaterial: async ({ image_base64, sample_key, location = 'Hyderabad' }) => {
    const res = await apiClient.post('/ai/classify-material', {
      image_base64,
      sample_key,
      location,
    });
    return res.data;
  },
};

export default aiService;
