import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import ProgressHero from "../../components/client/ProgressHero";
import { ReviewQueueList, DocumentRow, TeamMemberRow } from "../../components/client/ClientWidgets";
import { PageLoader, EmptyState } from "../../components/common/EmptyState";
import { ActivityFeed } from "../../components/admin/DashboardWidgets";
import useAuth from "../../hooks/useAuth";
import {
  useGetProjectsQuery,
  useGetApprovalsQuery,
  useGetDocumentsByProjectQuery,
  useGetNotificationsQuery,
} from "../../app/api/apiSlice";
import { getStageByNumber } from "../../constants/stages";
import { formatRelativeTime, formatDate } from "../../utils/format";
import { ROUTES } from "../../constants/routes";

const NOTIFICATION_COLORS = {
  approval_requested: "var(--color-amber-dark)",
  approval_completed: "var(--color-green-on-tint)",
  document_uploaded: "var(--color-info)",
  stage_completed: "var(--color-green-on-tint)",
  deadline_reminder: "var(--color-danger)",
  feedback_received: "var(--color-stage-3)",
  team_assigned: "var(--color-navy)",
};

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useGetProjectsQuery({ role: user?.role, userId: user?.id });
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // A client with several projects gets a switcher; the dashboard otherwise
  // defaults to their first project.
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const { data: approvals = [] } = useGetApprovalsQuery(
    { projectId: activeProject?.id },
    { skip: !activeProject }
  );
  const { data: documents = [] } = useGetDocumentsByProjectQuery(
    { projectId: activeProject?.id, clientVisibleOnly: true },
    { skip: !activeProject }
  );
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });

  if (isLoading) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  if (!activeProject) {
    return (
      <>
        <Topbar title="Welcome" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <EmptyState icon="folder" title="No projects yet" description="Your assigned projects will appear here." />
      </>
    );
  }

  const stage = getStageByNumber(activeProject.currentStage);
  const firstName = user?.name?.split(" ")[0];
  // Only items genuinely pending on the client — never internal review items.
  const reviewItems = approvals.filter((a) => a.urgency === "client-action");

  const recentActivity = notifications.slice(0, 6).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    color: NOTIFICATION_COLORS[n.type] || stage.color,
  }));

  return (
    <>
      <Topbar
        title={`Welcome back, ${firstName}`}
        subtitle={`${activeProject.title} is in ${stage.shortName}`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        actions={
          <Button
            variant="primary"
            icon={<Icon name="eye" size={15} />}
            onClick={() => navigate(ROUTES.CLIENT.PROJECT_DOCUMENTS(activeProject.id))}
          >
            View drawings
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        {projects.length > 1 && (
          <div className="flex items-center gap-2.5 mb-4.5">
            <Icon name="folders" size={15} className="text-(--color-text-secondary) flex-shrink-0" />
            <label htmlFor="dashboard-project-switch" className="text-xs font-semibold text-(--color-text-secondary)">
              Viewing
            </label>
            <select
              id="dashboard-project-switch"
              className="input-field w-auto py-1.5 text-[13px] font-semibold"
              value={activeProject.id}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.progressPercent >= 100 ? " · complete" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <ProgressHero project={activeProject} />

        <Card padded={false} className="mb-4.5">
          <CardHeader
            title="Project timeline"
            action={
              <button
                className="text-xs font-semibold text-(--color-portal-primary)"
                onClick={() => navigate(ROUTES.CLIENT.PROJECT_TIMELINE(activeProject.id))}
              >
                View full timeline
              </button>
            }
          />
          <CardBody>
            <StageTracker currentStage={activeProject.currentStage} />
          </CardBody>
        </Card>

        {/* Amber banner — shown only when something is genuinely pending on
            the client, never for internal review items. */}
        {reviewItems.length > 0 && (
          <div className="border border-(--color-amber) rounded-(--radius-md) bg-(--color-amber-light) px-6 py-5 mb-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-amber-dark)">
                <Icon name="alert-triangle" size={12} />
                Action required · {reviewItems[0].dueIn}
              </span>
              <span className="text-lg font-semibold text-(--color-text-primary)">
                {reviewItems.length} document{reviewItems.length > 1 ? "s" : ""} need{reviewItems.length === 1 ? "s" : ""} your review
              </span>
              <span className="text-[13px] text-(--color-text-secondary)">
                Sent {formatDate(reviewItems[0].requestedAt, "d MMMM")}. Review the drawings, leave a comment if anything needs changing, then approve to keep the project moving.
              </span>
            </div>
            <Button
              variant="accent"
              className="flex-none"
              onClick={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(activeProject.id))}
            >
              Review &amp; approve
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4.5">
          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader
                title="Needs your review"
                action={
                  <button
                    className="text-xs font-semibold text-(--color-portal-primary)"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(activeProject.id))}
                  >
                    View all
                  </button>
                }
              />
              <CardBody>
                <ReviewQueueList
                  approvals={reviewItems}
                  onReview={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(activeProject.id))}
                />
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Recent documents"
                action={
                  <button
                    className="text-xs font-semibold text-(--color-portal-primary)"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_DOCUMENTS(activeProject.id))}
                  >
                    Document centre
                  </button>
                }
              />
              <CardBody>
                {documents.length === 0 ? (
                  <p className="text-sm text-(--color-text-secondary) py-6 text-center">
                    {activeProject.currentStage < 2
                      ? "Documents will appear here as work on your project progresses."
                      : "No documents have been shared yet."}
                  </p>
                ) : (
                  documents.slice(0, 3).map((doc) => <DocumentRow key={doc.id} doc={doc} />)
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader title="Recent updates" />
              <CardBody>
                <ActivityFeed activity={recentActivity} />
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader title="Project team" />
              <CardBody>
                {activeProject.team.map((m) => (
                  <TeamMemberRow key={m.userId} member={m} />
                ))}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
