import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
if (API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = API_BASE_URL.replace('/api/v1', '/api');
} else if (API_BASE_URL.endsWith('/api/v1/')) {
  API_BASE_URL = API_BASE_URL.replace('/api/v1/', '/api');
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network Error - Backend might be down');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
