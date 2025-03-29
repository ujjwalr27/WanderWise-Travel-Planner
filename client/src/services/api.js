import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Itinerary API
export const itineraryApi = {
  create: (data) => api.post('/api/itineraries', data),
  getAll: (params) => api.get('/api/itineraries', { params }),
  getById: (id) => api.get(`/api/itineraries/${id}`),
  update: (id, data) => api.patch(`/api/itineraries/${id}`, data),
  delete: (id) => api.delete(`/api/itineraries/${id}`),
  share: (id, email) => api.post(`/api/itineraries/${id}/share`, { email }),
  searchNearby: (params) => api.get('/api/itineraries/search/nearby', { params })
};

// AI API
export const aiApi = {
  generateItinerary: (data) => api.post('/api/ai/generate', data),
  getDestinationInsights: (params) => api.get('/api/ai/insights', { params }),
  suggestActivities: (data) => api.post('/api/ai/suggest-activities', data),
  optimizeItinerary: (id, data) => api.post(`/api/ai/optimize/${id}`, data),
  getRecommendations: (data) => api.post('/api/ai/recommendations', data)
};

// Auth API
export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.patch('/api/users/profile', data),
  changePassword: (data) => api.post('/api/users/change-password', data),
  logout: () => api.post('/api/auth/logout')
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 