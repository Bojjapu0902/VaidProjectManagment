import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve } from "./mockAdapter";
import { MOCK_NOTIFICATIONS } from "../data/database";
import { withId, withIds } from "./normalize";

export const notificationService = {
  async getNotifications(userId) {
    if (USE_MOCKS) {
      return mockResolve(MOCK_NOTIFICATIONS.filter((n) => n.userId === userId));
    }
    const { data } = await axiosInstance.get("/notifications");
    return { data: withIds(data) };
  },

  async markAsRead(notificationId) {
    if (USE_MOCKS) return mockResolve({ id: notificationId, isRead: true });
    const { data } = await axiosInstance.put(`/notifications/${notificationId}/read`);
    return { data: withId(data) };
  },

  async markAllAsRead(userId) {
    if (USE_MOCKS) return mockResolve({ userId, success: true });
    return axiosInstance.put("/notifications/read-all");
  },
};
