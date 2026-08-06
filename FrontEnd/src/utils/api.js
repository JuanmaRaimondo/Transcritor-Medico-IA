import axios from 'axios';

const api = axios.create({
  // CAMBIO 1: Forzamos la ruta relativa. 
  // Esto soluciona para siempre el Mixed Content de la IP.
  baseURL: '', 
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor for adding the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // CAMBIO 2: Solo evitamos enviar el token en login y register.
    // Si la ruta NO es login y NO es register, entonces SÍ manda el token.
    const isAuthRoute = config.url.includes('/api/auth/google');
    
    if (token && !isAuthRoute) {
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