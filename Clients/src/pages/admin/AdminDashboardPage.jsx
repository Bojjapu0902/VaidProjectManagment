import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import StatCard from "../../components/admin/StatCard";
import ProjectListItem from "../../components/admin/ProjectListItem";
import { ApprovalQueueList, DeadlineList, ActivityFeed } from "../../components/admin/DashboardWidgets";
import { Card, CardHeader } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import { PageLoader } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useGetProjectsQuery, useGetApprovalsQuery, useGetNotificationsQuery } from "../../app/api/apiSlice";
import { formatDate, formatRelativeTime } from "../../utils/format";
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

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useGetProjectsQuery({ role: user?.role, userId: user?.id });
  const { data: approvals = [] } = useGetApprovalsQuery({ pendingOnly: true });
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });

  const overdueCount = approvals.filter((a) => a.status === "overdue").length;
  // Completion isn't tracked as its own status in the schema — approximate it
  // from currently-loaded projects that have reached 100% progress.
  const completedCount = projects.filter((p) => p.progressPercent === 100).length;
  const now = new Date();
  const newThisMonthCount = projects.filter((p) => {
    const created = p.createdAt ? new Date(p.createdAt) : null;
    return created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const firstName = user?.name?.split(" ")[0];
  const heroProject = projects[0];

  // Deadlines have no dedicated backend model — they're derived here from
  // each active project's expected completion date (real MongoDB data,
  // just reshaped client-side instead of a separate mock array).
  const deadlines = projects
    .filter((p) => p.timeline?.expectedEndDate && new Date(p.timeline.expectedEndDate) >= now)
    .sort((a, b) => new Date(a.timeline.expectedEndDate) - new Date(b.timeline.expectedEndDate))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      date: p.timeline.expectedEndDate,
      title: "Expected completion",
      projectName: p.title,
    }));

  const activity = notifications.slice(0, 6).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    color: NOTIFICATION_COLORS[n.type] || "var(--color-navy)",
  }));

  return (
    <>
      <Topbar
        title={`Good morning, ${firstName}`}
        subtitle="Here's what's happening across your projects today"
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        hasUnread
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={16} />} onClick={() => navigate(ROUTES.ADMIN.PROJECT_NEW)}>
            New project
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Active projects"
            value={projects.length || "—"}
            icon="building-skyscraper"
            iconBg="var(--color-navy-light)"
            iconColor="var(--color-navy-on-tint)"
            delta={`${newThisMonthCount} new this month`}
            deltaType="up"
          />
          <StatCard
            label="Pending approvals"
            value={approvals.length}
            icon="clock-hour"
            iconBg="var(--color-amber-light)"
            iconColor="var(--color-amber-dark)"
            delta={`${overdueCount} overdue`}
            deltaType="warn"
          />
          <StatCard
            label="Upcoming deadlines"
            value={deadlines.length}
            icon="calendar-event"
            iconBg="var(--color-danger-bg)"
            iconColor="var(--color-danger)"
            delta={deadlines[0] ? `Next: ${formatDate(deadlines[0].date, "MMM d")}` : "None scheduled"}
            deltaType="flat"
          />
          <StatCard
            label="Completed projects"
            value={completedCount}
            icon="circle-check"
            iconBg="var(--color-green-light)"
            iconColor="var(--color-green-on-tint)"
            delta={`of ${projects.length || 0} loaded`}
            deltaType="up"
          />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-4.5 items-start">
          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader
                title="Active projects"
                action={
                  <button
                    className="text-xs font-semibold text-(--color-navy)"
                    onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}
                  >
                    View all projects
                  </button>
                }
              />
              <div className="px-5 py-2">
                {isLoading ? (
                  <PageLoader />
                ) : (
                  projects.map((project) => <ProjectListItem key={project.id} project={project} />)
                )}
              </div>
            </Card>

            {heroProject && (
              <Card padded={false}>
                <CardHeader
                  title={`${heroProject.title} — lifecycle progress`}
                  action={
                    <button
                      className="text-xs font-semibold text-(--color-navy)"
                      onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(heroProject.id))}
                    >
                      Open project
                    </button>
                  }
                />
                <div className="p-5">
                  <StageTracker currentStage={heroProject.currentStage} />
                </div>
              </Card>
            )}
          </div>

          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader
                title="Pending approvals"
                action={
                  <button className="text-xs font-semibold text-(--color-navy)" onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}>
                    View queue
                  </button>
                }
              />
              <div className="px-5">
                <ApprovalQueueList approvals={approvals} />
              </div>
            </Card>

            <Card padded={false} className="mb-4.5">
              <CardHeader title="Upcoming deadlines" action={<span className="text-xs font-semibold text-(--color-navy)">Calendar</span>} />
              <div className="px-5">
                <DeadlineList deadlines={deadlines} />
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title="Team activity" />
              <div className="px-5">
                <ActivityFeed activity={activity} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
