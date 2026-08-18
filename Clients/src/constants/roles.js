export const ROLES = {
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  ARCHITECT: "architect",
  DESIGNER: "designer",
  PRINCIPAL_DESIGNER: "principal_designer",
  ENGINEER: "engineer",
  CLIENT: "client",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.PROJECT_MANAGER]: "Project Manager",
  [ROLES.ARCHITECT]: "Architect",
  [ROLES.DESIGNER]: "Designer",
  [ROLES.PRINCIPAL_DESIGNER]: "Principal Designer",
  [ROLES.ENGINEER]: "Engineer",
  [ROLES.CLIENT]: "Client",
};

// RBAC permission matrix — mirrors the project instructions doc.
export const PERMISSIONS = {
  CREATE_PROJECT: "create_project",
  ASSIGN_TEAM: "assign_team",
  UPDATE_STAGE: "update_stage",
  UPLOAD_DOCUMENTS: "upload_documents",
  VIEW_ALL_PROJECTS: "view_all_projects",
  APPROVE_REJECT: "approve_reject",
  MANAGE_USERS: "manage_users",
  VIEW_REPORTS: "view_reports",
  CLIENT_MESSAGES: "client_messages",
};

const ADMIN_ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ADMIN_ALL,
  [ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.ASSIGN_TEAM,
    PERMISSIONS.UPDATE_STAGE,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.APPROVE_REJECT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CLIENT_MESSAGES,
  ],
  [ROLES.ARCHITECT]: [
    PERMISSIONS.UPDATE_STAGE,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.CLIENT_MESSAGES,
  ],
  [ROLES.DESIGNER]: [PERMISSIONS.UPDATE_STAGE, PERMISSIONS.UPLOAD_DOCUMENTS],
  [ROLES.PRINCIPAL_DESIGNER]: [PERMISSIONS.UPDATE_STAGE, PERMISSIONS.UPLOAD_DOCUMENTS],
  [ROLES.ENGINEER]: [PERMISSIONS.UPDATE_STAGE, PERMISSIONS.UPLOAD_DOCUMENTS],
  [ROLES.CLIENT]: [PERMISSIONS.APPROVE_REJECT, PERMISSIONS.CLIENT_MESSAGES],
};

export const hasPermission = (role, permission) =>
  (ROLE_PERMISSIONS[role] || []).includes(permission);

export const isAdminPortalRole = (role) => role !== ROLES.CLIENT;
