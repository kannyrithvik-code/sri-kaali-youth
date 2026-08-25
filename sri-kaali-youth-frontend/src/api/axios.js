import axios from 'axios';

// Default to backend https port 7271 as defined in launchSettings.json
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7271/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 (Unauthenticated) & 403 (Forbidden) handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('pendingLogin');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/login-approval') {
        window.location.href = '/login';
      }
    }
    // 403 Forbidden: Do NOT logout automatically. Return rejected promise so components handle gracefully.
    return Promise.reject(error);
  }
);

export default api;
