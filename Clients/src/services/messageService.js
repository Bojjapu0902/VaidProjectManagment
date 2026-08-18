import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve } from "./mockAdapter";
import { MOCK_MESSAGES } from "../data/database";
import { withId, withIds } from "./normalize";

// In-memory mock message log, keyed by conversationId. Seeded lazily from
// the legacy flat MOCK_MESSAGES array (which only knew about a project's
// default "General" conversation) the first time each conversation is read.
const mockMessagesByConversation = new Map();

const seedIfNeeded = (conversationId, projectId) => {
  if (mockMessagesByConversation.has(conversationId)) return;
  const isGeneral = conversationId === `general-${projectId}`;
  const seeded = isGeneral ? MOCK_MESSAGES.filter((m) => m.projectId === projectId) : [];
  mockMessagesByConversation.set(conversationId, [...seeded]);
};

export const messageService = {
  // conversationId is required; projectId is passed alongside only so the
  // mock branch can seed the legacy demo thread into the right group.
  async getMessages(conversationId, projectId) {
    if (USE_MOCKS) {
      seedIfNeeded(conversationId, projectId);
      return mockResolve(mockMessagesByConversation.get(conversationId) || []);
    }
    const { data } = await axiosInstance.get(`/conversations/${conversationId}/messages`);
    return { data: withIds(data) };
  },

  async sendMessage(conversationId, projectId, payload) {
    if (USE_MOCKS) {
      seedIfNeeded(conversationId, projectId);
      const msg = {
        id: `m${Date.now()}`,
        conversationId,
        projectId,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      mockMessagesByConversation.get(conversationId).push(msg);
      return mockResolve(msg);
    }
    const { data } = await axiosInstance.post(`/conversations/${conversationId}/messages`, payload);
    return { data: withId(data) };
  },
};
