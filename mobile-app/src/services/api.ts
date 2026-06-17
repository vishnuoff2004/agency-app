import axios from 'axios';
import { getToken, deleteToken, deleteUser } from '../utils/secureStore';
import { router } from 'expo-router';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://outward-likewise-dolphin.ngrok-free.dev/api',
  timeout: 10000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken();
      await deleteUser();
      try {
        router.replace('/login?sessionExpired=true');
      } catch (err) {
        console.warn('Axios interceptor: redirect failed', err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
