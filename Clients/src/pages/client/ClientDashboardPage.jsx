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
import { formatRelativeTime } from "../../utils/format";
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
  const primaryProject = projects[0];

  const { data: approvals = [] } = useGetApprovalsQuery(
    { projectId: primaryProject?.id },
    { skip: !primaryProject }
  );
  const { data: documents = [] } = useGetDocumentsByProjectQuery(
    { projectId: primaryProject?.id, clientVisibleOnly: true },
    { skip: !primaryProject }
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

  if (!primaryProject) {
    return (
      <>
        <Topbar title="Welcome" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <EmptyState icon="folder" title="No projects yet" description="Your assigned projects will appear here." />
      </>
    );
  }

  const stage = getStageByNumber(primaryProject.currentStage);
  const firstName = user?.name?.split(" ")[0];
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
        subtitle={`${primaryProject.title} is in ${stage.name}`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        actions={
          <Button
            variant="primary"
            icon={<Icon name="eye" size={15} />}
            onClick={() => navigate(ROUTES.CLIENT.PROJECT_DOCUMENTS(primaryProject.id))}
          >
            View drawings
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <ProgressHero project={primaryProject} />

        <Card padded={false} className="mb-4.5">
          <CardHeader
            title="Project timeline"
            action={
              <button
                className="text-xs font-semibold text-(--color-portal-primary)"
                onClick={() => navigate(ROUTES.CLIENT.PROJECT_TIMELINE(primaryProject.id))}
              >
                View full timeline
              </button>
            }
          />
          <CardBody>
            <StageTracker currentStage={primaryProject.currentStage} />
          </CardBody>
        </Card>

        <div className="grid grid-cols-[1.5fr_1fr] gap-4.5">
          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader
                title="Needs your review"
                action={
                  <button
                    className="text-xs font-semibold text-(--color-portal-primary)"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(primaryProject.id))}
                  >
                    View all
                  </button>
                }
              />
              <CardBody>
                <ReviewQueueList
                  approvals={reviewItems}
                  onReview={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(primaryProject.id))}
                />
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Recent documents"
                action={
                  <button
                    className="text-xs font-semibold text-(--color-portal-primary)"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_DOCUMENTS(primaryProject.id))}
                  >
                    Document centre
                  </button>
                }
              />
              <CardBody>
                {documents.slice(0, 3).map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
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
                {primaryProject.team.map((m) => (
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
