import axiosInstance from './axiosInstance';

export const productsApi = {
  async getProducts(category) {
    const params = {};
    if (category && category !== 'all') {
      params.category = category;
    }
    const response = await axiosInstance.get('/products', { params });
    return response.data;
  },

  async createProduct(productData) {
    const response = await axiosInstance.post('/products', productData);
    return response.data;
  }
};
