import { Navigate, useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { ProjectSummaryCard } from "../../components/client/ClientWidgets";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useGetProjectsQuery } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

export default function ClientProjectListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useGetProjectsQuery({ role: user?.role, userId: user?.id });

  if (isLoading) {
    return (
      <>
        <Topbar title="My projects" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  // Skipped entirely for a single-project client — the dashboard already
  // answers "where is my project" and a one-card list adds nothing.
  if (projects.length === 1) {
    return <Navigate to={ROUTES.CLIENT.DASHBOARD} replace />;
  }

  const liveCount = projects.filter((p) => p.progressPercent < 100).length;
  const completeCount = projects.length - liveCount;
  const subtitle =
    projects.length === 0
      ? undefined
      : completeCount > 0
        ? `${liveCount} live, ${completeCount} complete`
        : `${liveCount} live`;

  return (
    <>
      <Topbar title="My projects" subtitle={subtitle} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <EmptyState icon="folder" title="No projects yet" description="Your assigned projects will appear here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4.5">
            {projects.map((project) => (
              <ProjectSummaryCard
                key={project.id}
                project={project}
                onOpen={(p) => navigate(ROUTES.CLIENT.PROJECT_DETAIL(p.id))}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
