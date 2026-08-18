import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve, mockReject } from "./mockAdapter";
import { MOCK_PROJECTS, getProjectById } from "../data/database";
import { withId, withIds } from "./normalize";

// ---- Mock-mode conversation store -----------------------------------
// Mirrors the backend model closely enough for the UI to behave the same
// in mock mode: every project gets a lazily-created "General" group
// (project team + client), and admins/team can spin up additional named
// groups with a chosen subset of participants.
const mockConversationsByProject = new Map();

const projectRosterMock = (project) => {
  const client = project.clientId
    ? [{ userId: project.clientId, name: project.clientName }]
    : [];
  return [...client, ...project.team.map((m) => ({ userId: m.userId, name: m.name }))];
};

const getOrSeedMockConversations = (projectId) => {
  if (mockConversationsByProject.has(projectId)) return mockConversationsByProject.get(projectId);

  const project = getProjectById(projectId);
  const general = {
    id: `general-${projectId}`,
    projectId,
    name: "General",
    isDefault: true,
    participants: project ? projectRosterMock(project) : [],
    createdAt: new Date().toISOString(),
  };
  const list = [general];
  mockConversationsByProject.set(projectId, list);
  return list;
};

export const conversationService = {
  async getConversations(projectId) {
    if (USE_MOCKS) return mockResolve(getOrSeedMockConversations(projectId));
    const { data } = await axiosInstance.get(`/projects/${projectId}/conversations`);
    return { data: withIds(data) };
  },

  async createConversation(projectId, { name, participantIds }) {
    if (USE_MOCKS) {
      if (!name?.trim()) return mockReject("Group name is required", 400);
      const list = getOrSeedMockConversations(projectId);
      const project = getProjectById(projectId);
      const roster = project ? projectRosterMock(project) : [];
      const participants = roster.filter((p) => participantIds.includes(p.userId));
      const conversation = {
        id: `conv-${Date.now()}`,
        projectId,
        name: name.trim(),
        isDefault: false,
        participants,
        createdAt: new Date().toISOString(),
      };
      list.push(conversation);
      return mockResolve(conversation);
    }
    const { data } = await axiosInstance.post(`/projects/${projectId}/conversations`, { name, participantIds });
    return { data: withId(data) };
  },

  async addParticipant(conversationId, { userId, name }) {
    if (USE_MOCKS) return mockResolve({ id: conversationId, added: { userId, name } });
    const { data } = await axiosInstance.post(`/conversations/${conversationId}/participants`, { userId, name });
    return { data: withId(data) };
  },

  async removeParticipant(conversationId, userId) {
    if (USE_MOCKS) return mockResolve({ id: conversationId, removed: userId });
    const { data } = await axiosInstance.delete(`/conversations/${conversationId}/participants/${userId}`);
    return { data: withId(data) };
  },
};

// Exposed so messageService's mock branch can look up which project a mock
// "general-<id>" conversation belongs to without a real backend.
export const MOCK_PROJECT_IDS = MOCK_PROJECTS.map((p) => p.id);
