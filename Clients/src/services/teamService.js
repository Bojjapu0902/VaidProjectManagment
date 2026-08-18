import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve, mockReject } from "./mockAdapter";
import { MOCK_USERS, addMockTeamMember, updateMockUser, removeMockUser } from "../data/database";
import { ROLES } from "../constants/roles";

export const teamService = {
  async getTeamMembers() {
    if (USE_MOCKS) {
      return mockResolve(MOCK_USERS.filter((u) => u.role !== ROLES.CLIENT));
    }
    return axiosInstance.get("/users", { params: { role: "team" } });
  },

  async addTeamMember(payload) {
    if (USE_MOCKS) {
      const member = addMockTeamMember(payload);
      return mockResolve(member);
    }
    return axiosInstance.post("/users", payload);
  },

  async updateTeamMember(id, payload) {
    if (USE_MOCKS) {
      const updated = updateMockUser(id, payload);
      if (!updated) return mockReject("Team member not found", 404);
      return mockResolve(updated);
    }
    return axiosInstance.put(`/users/${id}`, payload);
  },

  async removeTeamMember(id) {
    if (USE_MOCKS) {
      const removed = removeMockUser(id);
      if (!removed) return mockReject("Team member not found", 404);
      return mockResolve({ id });
    }
    return axiosInstance.delete(`/users/${id}`);
  },
};
