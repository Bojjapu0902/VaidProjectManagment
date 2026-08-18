import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve, mockReject } from "./mockAdapter";
import { MOCK_PROJECTS, getProjectsByClient, getProjectById, addMockProject, removeMockProject } from "../data/database";
import { withId, withIds } from "./normalize";
import { ROLES } from "../constants/roles";

export const projectService = {
  async getProjects({ role, userId } = {}) {
    if (USE_MOCKS) {
      if (role === ROLES.CLIENT) {
        return mockResolve([...getProjectsByClient(userId)]);
      }
      return mockResolve([...MOCK_PROJECTS]);
    }
    const { data } = await axiosInstance.get("/projects");
    return { data: withIds(data) };
  },

  async getProjectById(id) {
    if (USE_MOCKS) {
      const project = getProjectById(id);
      if (!project) return mockReject("Project not found", 404);
      return mockResolve(project);
    }
    const { data } = await axiosInstance.get(`/projects/${id}`);
    return { data: withId(data) };
  },

  async createProject(payload) {
    if (USE_MOCKS) {
      const newProject = addMockProject({
        ...payload,
        id: `p${Date.now()}`,
        projectCode: `ARC-2026-${Math.floor(100 + Math.random() * 900)}`,
        currentStage: 1,
        progressPercent: 0,
        team: payload.team || [],
        description: payload.description || "No description provided yet.",
        timeline: {
          startDate: payload.timeline?.startDate || new Date().toISOString().slice(0, 10),
          expectedEndDate:
            payload.timeline?.expectedEndDate ||
            new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10),
        },
        budget: {
          min: payload.budget?.min || 0,
          max: payload.budget?.max || 0,
          currency: payload.budget?.currency || "INR",
        },
      });
      return mockResolve(newProject);
    }
    const { data } = await axiosInstance.post("/projects", payload);
    return { data: withId(data) };
  },

  async deleteProject(id) {
    if (USE_MOCKS) {
      removeMockProject(id);
      return mockResolve({ id });
    }
    const { data } = await axiosInstance.delete(`/projects/${id}`);
    return { data: withId(data) };
  },

  async updateStage(projectId, stageNumber, payload) {
    if (USE_MOCKS) {
      return mockResolve({ projectId, stageNumber, ...payload, updatedAt: new Date().toISOString() });
    }
    const { data } = await axiosInstance.put(`/projects/${projectId}/stages/${stageNumber}`, payload);
    return { data: withId(data) };
  },

  async assignTeamMember(projectId, member) {
    if (USE_MOCKS) return mockResolve({ projectId, member });
    const { data } = await axiosInstance.post(`/projects/${projectId}/team`, member);
    return { data: withId(data) };
  },

  async removeTeamMember(projectId, userId) {
    if (USE_MOCKS) return mockResolve({ projectId, userId });
    const { data } = await axiosInstance.delete(`/projects/${projectId}/team/${userId}`);
    return { data: withId(data) };
  },

  async submitFinalReview(projectId, payload) {
    if (USE_MOCKS) {
      return mockResolve({ projectId, finalReview: { ...payload, submittedAt: new Date().toISOString() } });
    }
    const { data } = await axiosInstance.put(`/projects/${projectId}/final-review`, payload);
    return { data: withId(data) };
  },
};
