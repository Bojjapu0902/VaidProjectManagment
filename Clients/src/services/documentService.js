import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve } from "./mockAdapter";
import { MOCK_DOCUMENTS } from "../data/database";
import { withId, withIds } from "./normalize";

export const documentService = {
  async getDocumentsByProject(projectId, { clientVisibleOnly = false } = {}) {
    if (USE_MOCKS) {
      let docs = MOCK_DOCUMENTS.filter((d) => d.projectId === projectId);
      if (clientVisibleOnly) docs = docs.filter((d) => d.isClientVisible);
      return mockResolve(docs);
    }
    const { data } = await axiosInstance.get(`/projects/${projectId}/documents`, {
      params: { clientVisibleOnly },
    });
    return { data: withIds(data) };
  },

  async uploadDocument(projectId, payload) {
    if (USE_MOCKS) {
      return mockResolve({
        id: `d${Date.now()}`,
        projectId,
        version: 1,
        createdAt: new Date().toISOString(),
        ...payload,
      });
    }
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
    const { data } = await axiosInstance.post(`/projects/${projectId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: withId(data) };
  },
};
