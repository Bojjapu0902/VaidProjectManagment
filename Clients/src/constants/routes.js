export const ROUTES = {
  LOGIN: "/login",
  RESET_PASSWORD: "/reset-password",

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    PROJECTS: "/admin/projects",
    PROJECT_NEW: "/admin/projects/new",
    PROJECT_DETAIL: (id = ":id") => `/admin/projects/${id}`,
    PROJECT_STAGES: (id = ":id") => `/admin/projects/${id}/stages`,
    PROJECT_DOCUMENTS: (id = ":id") => `/admin/projects/${id}/documents`,
    PROJECT_TEAM: (id = ":id") => `/admin/projects/${id}/team`,
    PROJECT_APPROVALS: (id = ":id") => `/admin/projects/${id}/approvals`,
    PROJECT_MESSAGES: (id = ":id") => `/admin/projects/${id}/messages`,
    TEAM: "/admin/team",
    CLIENTS: "/admin/clients",
    REPORTS: "/admin/reports",
    NOTIFICATIONS: "/admin/notifications",
    SETTINGS: "/admin/settings",
  },

  CLIENT: {
    DASHBOARD: "/client/dashboard",
    PROJECTS: "/client/projects",
    PROJECT_DETAIL: (id = ":id") => `/client/projects/${id}`,
    PROJECT_TIMELINE: (id = ":id") => `/client/projects/${id}/timeline`,
    PROJECT_DOCUMENTS: (id = ":id") => `/client/projects/${id}/documents`,
    PROJECT_APPROVALS: (id = ":id") => `/client/projects/${id}/approvals`,
    PROJECT_MESSAGES: (id = ":id") => `/client/projects/${id}/messages`,
    PROJECT_FINAL_REVIEW: (id = ":id") => `/client/projects/${id}/final-review`,
    NOTIFICATIONS: "/client/notifications",
    PROFILE: "/client/profile",
  },
};
