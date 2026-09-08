import apiClient from './apiClient';

export const authService = {
  login: async (username_or_phone, password) => {
    const res = await apiClient.post('/auth/login', {
      username_or_phone,
      password,
    });
    return res.data;
  },

  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('recyclink_token');
    localStorage.removeItem('recyclink_user');
  }
};

export default authService;
