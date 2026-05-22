import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://195.26.254.97:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor for adding the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Evitamos enviar el token para rutas de autenticación pública (login/register)
    if (token && !config.url.includes('/api/auth/')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for handling auth errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el servidor retorna 401 (No autorizado) o 403 (Prohibido), limpiamos localStorage y redirigimos
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
