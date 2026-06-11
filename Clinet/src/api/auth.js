import axiosInstance from './axiosInstance';

export const authApi = {
  async register(userData) {
    const response = await axiosInstance.post('/auth/register', userData);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await axiosInstance.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await axiosInstance.get(`${baseURL}auth/me`);
    return response.data;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
