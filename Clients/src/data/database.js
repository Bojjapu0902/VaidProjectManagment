// Single client-side data source, backed by ./database.json.
// When the Mongo-backed API (see Server/) is wired up, these exports
// swap for real fetch/axios calls without touching the pages/services
// that import from here.
import { ROLES } from "../constants/roles";
import db from "./database.json";

// The browser can't write back to database.json, so writes go to
// localStorage instead — it's the "live" copy of the seed data. On load we
// prefer whatever was last persisted there; database.json only supplies the
// initial/default dataset for a fresh browser.
const USERS_STORAGE_KEY = "archpro_users_db";

const readPersistedUsers = () => {
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUsers = () => {
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
  } catch {
    // localStorage unavailable — changes just won't persist across reloads
  }
};

export const MOCK_USERS = readPersistedUsers() ?? db.users;
export const MOCK_PROJECTS = db.projects;
export const MOCK_DOCUMENTS = db.documents;
export const MOCK_APPROVALS = db.approvals;
export const MOCK_NOTIFICATIONS = db.notifications;
export const MOCK_MESSAGES = db.messages;
export const MOCK_ACTIVITY = db.activity;
export const MOCK_DEADLINES = db.deadlines;

export const findUserByEmail = (email) =>
  MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

export const getUserById = (id) => MOCK_USERS.find((u) => u.id === id);

// Mutates the in-memory array so a client added while creating a
// project is immediately available across the app (Client Management,
// project client-select dropdowns, etc). A real backend would persist
// this via MongoDB instead.
export const addMockClient = ({ name, email, phone, company }) => {
  const newClient = {
    id: `c${Date.now()}`,
    name,
    email,
    role: ROLES.CLIENT,
    avatarInitials: name.slice(0, 2).toUpperCase(),
    phone: phone || "",
    company: company || "Individual Client",
    password: "password123",
  };
  MOCK_USERS.push(newClient);
  persistUsers();
  return newClient;
};

// Same idea as addMockClient, but for a brand-new internal team member
// added while assembling a project's team (see CreateProjectPage) or from
// the Team management page directly.
export const addMockTeamMember = ({ name, email, phone, role }) => {
  const newMember = {
    id: `u${Date.now()}`,
    name,
    email,
    role: role || ROLES.ARCHITECT,
    avatarInitials: name.slice(0, 2).toUpperCase(),
    phone: phone || "",
    company: "Vaid Studio",
    password: "password123",
  };
  MOCK_USERS.push(newMember);
  persistUsers();
  return newMember;
};

// Updates an existing user (team member or client) in place and persists
// the change. A real backend would PATCH/PUT this via MongoDB instead.
export const updateMockUser = (id, updates) => {
  const index = MOCK_USERS.findIndex((u) => u.id === id);
  if (index === -1) return null;
  MOCK_USERS[index] = { ...MOCK_USERS[index], ...updates };
  persistUsers();
  return MOCK_USERS[index];
};

// Removes a user (team member or client) from the in-memory array and
// persists the change. A real backend would delete this via MongoDB instead.
export const removeMockUser = (id) => {
  const index = MOCK_USERS.findIndex((u) => u.id === id);
  if (index === -1) return false;
  MOCK_USERS.splice(index, 1);
  persistUsers();
  return true;
};

export const getProjectsByClient = (clientId) =>
  MOCK_PROJECTS.filter((p) => p.clientId === clientId);

export const getProjectById = (id) => MOCK_PROJECTS.find((p) => p.id === id);

// Mutates the in-memory array so a project created during this session
// is immediately findable by getProjectById/getProjectsByClient. A real
// backend would persist this via MongoDB instead.
export const addMockProject = (project) => {
  MOCK_PROJECTS.push(project);
  return project;
};
