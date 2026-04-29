import axios from 'axios';
import store from '../store';
import { clearAuth } from '../store/authSlice';

// In production (Vercel), use the deployed server URL from env variable.
// In development, use relative path so Vite proxy handles it.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT from Redux store on every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry logic — retry up to 2 times on network errors or 5xx
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config._retryCount = config._retryCount || 0;
    const isNetworkError = !error.response;
    const is5xx = error.response?.status >= 500;

    if ((isNetworkError || is5xx) && config._retryCount < 2) {
      config._retryCount += 1;
      await new Promise((r) => setTimeout(r, 600 * config._retryCount));
      return api(config);
    }

    if (error.response?.status === 401) {
      store.dispatch(clearAuth());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
