import axiosInstance from './axiosInstance';

export const notificationsApi = {
  async getNotifications() {
    const response = await axiosInstance.get('/dashboard/notifications');
    return response.data;
  },

  async markRead(notificationId) {
    const response = await axiosInstance.patch(`/dashboard/notifications/${notificationId}/read`);
    return response.data;
  }
};
