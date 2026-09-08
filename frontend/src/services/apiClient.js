import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('recyclink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/collector') && currentPath !== '/collector/login') {
        localStorage.removeItem('recyclink_token');
        localStorage.removeItem('recyclink_user');
        window.location.href = '/collector/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
