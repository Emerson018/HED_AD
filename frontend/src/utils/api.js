import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Interceptador para injetar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Injeta a seleção de banco de dados ativo para o backend
    const activeDb = localStorage.getItem('active_db') || 'supabase';
    config.headers['X-Active-DB'] = activeDb;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de Resposta: Renova o token automaticamente se der 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e a requisição não foi uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Tenta pegar um novo access_token usando o refresh_token
          const activeDb = localStorage.getItem('active_db') || 'supabase';
          const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: refreshToken,
          }, {
            headers: {
              'X-Active-DB': activeDb
            }
          });

          // Salva o novo token
          localStorage.setItem('access_token', res.data.access);

          // Atualiza a requisição original com o novo token e tenta de novo
          originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
          originalRequest.headers['X-Active-DB'] = activeDb;
          return api(originalRequest);
        } catch (refreshError) {
          // Se o refresh falhar, limpa tudo e joga pro login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
