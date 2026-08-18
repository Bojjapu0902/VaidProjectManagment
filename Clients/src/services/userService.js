import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve, mockReject } from "./mockAdapter";
import { MOCK_USERS, MOCK_PROJECTS } from "../data/database";
import { ROLES } from "../constants/roles";

// Normalizes a Mongo document ({_id, ...}) to the {id, ...} shape the rest
// of the app (built against mock data) already expects.
const normalize = (u) => (u ? { ...u, id: u.id || u._id } : u);
const normalizeList = (list) => (list || []).map(normalize);

const workloadFromMocks = () =>
  MOCK_USERS.filter((u) => u.role !== ROLES.CLIENT).map((u) => ({
    userId: u.id,
    name: u.name,
    role: u.role,
    avatarInitials: u.avatarInitials,
    activeProjects: MOCK_PROJECTS.filter((p) => p.team.some((m) => m.userId === u.id)).length,
  }));

export const userService = {
  async getUsers({ role, search } = {}) {
    if (USE_MOCKS) {
      let users = MOCK_USERS;
      if (role) users = users.filter((u) => u.role === role);
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }
      // eslint-disable-next-line no-unused-vars
      return mockResolve(users.map(({ password, ...safe }) => safe));
    }
    const { data } = await axiosInstance.get("/users", { params: { role, search } });
    return { data: normalizeList(data) };
  },

  async getUserById(id) {
    if (USE_MOCKS) {
      const user = MOCK_USERS.find((u) => u.id === id);
      if (!user) return mockReject("User not found", 404);
      // eslint-disable-next-line no-unused-vars
      const { password, ...safe } = user;
      return mockResolve(safe);
    }
    const { data } = await axiosInstance.get(`/users/${id}`);
    return { data: normalize(data) };
  },

  async createUser(payload) {
    if (USE_MOCKS) {
      const newUser = {
        id: `u${Date.now()}`,
        avatarInitials: payload.name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        ...payload,
      };
      MOCK_USERS.push({ ...newUser, password: payload.password || "changeme123" });
      return mockResolve(newUser);
    }
    const { data } = await axiosInstance.post("/users", payload);
    return { data: normalize(data) };
  },

  async updateUser(id, payload) {
    if (USE_MOCKS) return mockResolve({ id, ...payload });
    const { data } = await axiosInstance.put(`/users/${id}`, payload);
    return { data: normalize(data) };
  },

  async deactivateUser(id) {
    if (USE_MOCKS) return mockResolve({ id, isActive: false });
    const { data } = await axiosInstance.delete(`/users/${id}`);
    return { data: normalize(data) };
  },

  async getTeamWorkload() {
    if (USE_MOCKS) return mockResolve(workloadFromMocks());
    const { data } = await axiosInstance.get("/users/team/workload");
    return { data };
  },
};
