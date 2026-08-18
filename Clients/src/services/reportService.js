import axiosInstance, { USE_MOCKS } from "./axiosInstance";
import { mockResolve } from "./mockAdapter";
import { MOCK_PROJECTS, MOCK_USERS, MOCK_APPROVALS } from "../data/database";
import { withIds } from "./normalize";
import { ROLES } from "../constants/roles";
import { STAGES } from "../constants/stages";

const projectsReportFromMocks = () => {
  const active = MOCK_PROJECTS;
  const avgProgress =
    active.reduce((sum, p) => sum + p.progressPercent, 0) / (active.length || 1);

  return {
    summary: {
      total: active.length,
      avgProgress,
      totalBudgetMin: active.reduce((s, p) => s + (p.budget?.min || 0), 0),
      totalBudgetMax: active.reduce((s, p) => s + (p.budget?.max || 0), 0),
    },
    byStage: STAGES.map((s) => ({
      stage: s.number,
      count: active.filter((p) => p.currentStage === s.number).length,
    })),
    byType: ["Residential", "Commercial", "Civic", "Industrial", "Mixed-Use"]
      .map((type) => ({ type, count: active.filter((p) => p.type === type).length }))
      .filter((t) => t.count > 0),
    archivedVsActive: [{ archived: false, count: active.length }],
  };
};

const teamReportFromMocks = () =>
  MOCK_USERS.filter((u) => u.role !== ROLES.CLIENT).map((u) => ({
    userId: u.id,
    name: u.name,
    role: u.role,
    isActive: true,
    activeProjects: MOCK_PROJECTS.filter((p) => p.team.some((m) => m.userId === u.id)).length,
    approvalsRequested: MOCK_APPROVALS.filter((a) => a.requestedBy === u.id).length,
  }));

const approvalsReportFromMocks = () => {
  const byStatus = MOCK_APPROVALS.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  return { total: MOCK_APPROVALS.length, byStatus, avgTurnaroundHours: 0, recent: MOCK_APPROVALS.slice(0, 20) };
};

export const reportService = {
  async getProjectsReport() {
    if (USE_MOCKS) return mockResolve(projectsReportFromMocks());
    return axiosInstance.get("/reports/projects");
  },

  async getTeamReport() {
    if (USE_MOCKS) return mockResolve(teamReportFromMocks());
    return axiosInstance.get("/reports/team");
  },

  async getApprovalsReport() {
    if (USE_MOCKS) return mockResolve(approvalsReportFromMocks());
    const { data } = await axiosInstance.get("/reports/approvals");
    return { data: { ...data, recent: withIds(data.recent) } };
  },

  async getProjectReport(projectId) {
    if (USE_MOCKS) {
      const project = MOCK_PROJECTS.find((p) => p.id === projectId);
      return mockResolve({ project, approvals: { total: 0, approved: 0, rejected: 0, pending: 0 } });
    }
    return axiosInstance.get(`/reports/projects/${projectId}`);
  },
};
