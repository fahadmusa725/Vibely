import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vibely_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        !error.config.url.includes('/auth/login') &&
        !error.config.url.includes('/auth/register') &&
        !error.config.url.includes('/auth/change-password')
      ) {
        localStorage.removeItem('vibely_token');
        localStorage.removeItem('vibely_user');
        window.dispatchEvent(new Event('vibely:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
