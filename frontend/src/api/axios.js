import axios from 'axios';

// Gunakan domain yang sama dengan frontend; Vercel meneruskan /api ke backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Interceptor Request: selipkan token JWT ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: tangani token kedaluwarsa (401) -> logout paksa
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
