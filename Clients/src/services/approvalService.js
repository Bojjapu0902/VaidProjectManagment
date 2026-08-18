import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve } from "./mockAdapter";
import { MOCK_APPROVALS } from "../data/database";
import { withId, withIds } from "./normalize";

export const approvalService = {
  async getApprovals({ projectId, pendingOnly = false } = {}) {
    if (USE_MOCKS) {
      let approvals = MOCK_APPROVALS;
      if (projectId) approvals = approvals.filter((a) => a.projectId === projectId);
      if (pendingOnly) approvals = approvals.filter((a) => a.status !== "approved");
      return mockResolve(approvals);
    }
    const { data } = await axiosInstance.get("/approvals", { params: { projectId, pendingOnly } });
    return { data: withIds(data) };
  },

  async requestApproval(projectId, payload) {
    if (USE_MOCKS) {
      return mockResolve({ id: `a${Date.now()}`, projectId, status: "pending", ...payload });
    }
    const { data } = await axiosInstance.post(`/projects/${projectId}/approvals`, payload);
    return { data: withId(data) };
  },

  async reviewApproval(approvalId, { decision, comment }) {
    if (USE_MOCKS) {
      return mockResolve({
        id: approvalId,
        status: decision,
        comment,
        reviewedAt: new Date().toISOString(),
      });
    }
    const { data } = await axiosInstance.put(`/approvals/${approvalId}`, { decision, comment });
    return { data: withId(data) };
  },
};
