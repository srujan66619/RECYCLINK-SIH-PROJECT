import apiClient from './apiClient';

export const safetyService = {
  getSafetyGuides: async (lang = 'en') => {
    const res = await apiClient.get('/safety-guides', {
      params: { lang },
    });
    return res.data;
  },
};

export default safetyService;
