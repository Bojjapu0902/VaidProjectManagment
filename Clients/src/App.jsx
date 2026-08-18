import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import ClientLayout from "./components/layout/ClientLayout";
import ToastContainer from "./components/common/ToastContainer";
import useThemeSync from "./hooks/useThemeSync";
import { ROUTES } from "./constants/routes";

import LoginPage from "./pages/auth/LoginPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProjectListPage from "./pages/admin/AdminProjectListPage";
import CreateProjectPage from "./pages/admin/CreateProjectPage";
import AdminProjectDetailPage from "./pages/admin/AdminProjectDetailPage";
import StageManagementPage from "./pages/admin/StageManagementPage";
import DocumentManagementPage from "./pages/admin/DocumentManagementPage";
import TeamAssignmentPage from "./pages/admin/TeamAssignmentPage";
import ApprovalManagementPage from "./pages/admin/ApprovalManagementPage";
import AdminProjectMessagesPage from "./pages/admin/AdminProjectMessagesPage";
import TeamManagementPage from "./pages/admin/TeamManagementPage";
import ClientManagementPage from "./pages/admin/ClientManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

import ClientDashboardPage from "./pages/client/ClientDashboardPage";
import ClientProjectListPage from "./pages/client/ClientProjectListPage";
import ClientProjectOverviewPage from "./pages/client/ClientProjectOverviewPage";
import ClientProjectTimelinePage from "./pages/client/ClientProjectTimelinePage";
import ClientApprovalsPage from "./pages/client/ClientApprovalsPage";
import ClientDocumentsPage from "./pages/client/ClientDocumentsPage";
import ClientMessagesPage from "./pages/client/ClientMessagesPage";
import ClientFinalReviewPage from "./pages/client/ClientFinalReviewPage";
import ClientNotificationsPage from "./pages/client/ClientNotificationsPage";
import ClientProfilePage from "./pages/client/ClientProfilePage";

export default function App() {
  useThemeSync();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* ---------- Admin / Team Portal ---------- */}
        <Route element={<ProtectedRoute portal="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN.PROJECTS} element={<AdminProjectListPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_NEW} element={<CreateProjectPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_DETAIL()} element={<AdminProjectDetailPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_STAGES()} element={<StageManagementPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_DOCUMENTS()} element={<DocumentManagementPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_TEAM()} element={<TeamAssignmentPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_APPROVALS()} element={<ApprovalManagementPage />} />
            <Route path={ROUTES.ADMIN.PROJECT_MESSAGES()} element={<AdminProjectMessagesPage />} />
            <Route path={ROUTES.ADMIN.TEAM} element={<TeamManagementPage />} />
            <Route path={ROUTES.ADMIN.CLIENTS} element={<ClientManagementPage />} />
            <Route path={ROUTES.ADMIN.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.ADMIN.NOTIFICATIONS} element={<AdminNotificationsPage />} />
            <Route path={ROUTES.ADMIN.SETTINGS} element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* ---------- Client Portal ---------- */}
        <Route element={<ProtectedRoute portal="client" />}>
          <Route element={<ClientLayout />}>
            <Route path={ROUTES.CLIENT.DASHBOARD} element={<ClientDashboardPage />} />
            <Route path={ROUTES.CLIENT.PROJECTS} element={<ClientProjectListPage />} />
            <Route path={ROUTES.CLIENT.PROJECT_DETAIL()} element={<ClientProjectOverviewPage />} />
            <Route path={ROUTES.CLIENT.PROJECT_TIMELINE()} element={<ClientProjectTimelinePage />} />
            <Route path={ROUTES.CLIENT.PROJECT_DOCUMENTS()} element={<ClientDocumentsPage />} />
            <Route path={ROUTES.CLIENT.PROJECT_APPROVALS()} element={<ClientApprovalsPage />} />
            <Route path={ROUTES.CLIENT.PROJECT_MESSAGES()} element={<ClientMessagesPage />} />
            <Route path={ROUTES.CLIENT.PROJECT_FINAL_REVIEW()} element={<ClientFinalReviewPage />} />
            <Route path={ROUTES.CLIENT.NOTIFICATIONS} element={<ClientNotificationsPage />} />
            <Route path={ROUTES.CLIENT.PROFILE} element={<ClientProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
}
