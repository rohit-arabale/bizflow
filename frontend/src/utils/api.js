import axios from 'axios';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const configuredApiOrigin = trimTrailingSlash(import.meta.env.VITE_API_URL || '');

export const getBackendOrigin = () => {
  if (configuredApiOrigin) return configuredApiOrigin;
  if (typeof window === 'undefined') return '';

  const { protocol, hostname, port, origin } = window.location;
  const isLocalFrontend = ['localhost', '127.0.0.1'].includes(hostname) && port === '5173';

  return isLocalFrontend ? `${protocol}//${hostname}:5000` : origin;
};

export const API_BASE_URL = configuredApiOrigin ? `${configuredApiOrigin}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bizflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Response interceptor - handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bizflow_token');
      localStorage.removeItem('bizflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
