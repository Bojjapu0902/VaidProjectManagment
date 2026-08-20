import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve, mockReject } from "./mockAdapter";
import { findUserByEmail } from "../data/database";

const generateMockToken = (userId) => `mock-jwt-${userId}-${Date.now()}`;

export const authService = {
  async login({ email, password }) {
    if (USE_MOCKS) {
      const user = findUserByEmail(email);
      if (!user || user.password !== password) {
        return mockReject("Invalid email or password", 401);
      }
      const { password: _pw, ...safeUser } = user;
      return mockResolve({
        user: safeUser,
        accessToken: generateMockToken(user.id),
        refreshToken: generateMockToken(user.id) + "-refresh",
      });
    }
    return axiosInstance.post("/auth/login", { email, password });
  },

  async logout() {
    if (USE_MOCKS) return mockResolve({ success: true });
    return axiosInstance.post("/auth/logout");
  },

  async getCurrentUser() {
    if (USE_MOCKS) {
      const cached = localStorage.getItem("archpro_user");
      if (!cached) return mockReject("Not authenticated", 401);
      return mockResolve(JSON.parse(cached));
    }
    return axiosInstance.get("/auth/me");
  },

  async forgotPassword({ email }) {
    if (USE_MOCKS) {
      // Always the same response whether the email exists or not — the API
      // never confirms which accounts are registered.
      return mockResolve({ message: "If that email exists, a reset link has been sent." });
    }
    return axiosInstance.post("/auth/forgot-password", { email });
  },

  async resetPassword({ token, password }) {
    if (USE_MOCKS) {
      if (!token) return mockReject("Reset token is invalid or has expired", 400);
      return mockResolve({ message: "Password has been reset. Please log in with your new password." });
    }
    return axiosInstance.post("/auth/reset-password", { token, password });
  },
};
