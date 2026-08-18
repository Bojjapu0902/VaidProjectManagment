import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import { StageBadge } from "../../components/common/Badge";
import ProgressBar from "../../components/common/ProgressBar";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useGetProjectsQuery } from "../../app/api/apiSlice";
import { getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

export default function ClientProjectListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useGetProjectsQuery({ role: user?.role, userId: user?.id });

  return (
    <>
      <Topbar title="My projects" subtitle={`${projects.length} projects assigned to you`} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        {isLoading ? (
          <PageLoader />
        ) : projects.length === 0 ? (
          <EmptyState icon="folder" title="No projects yet" />
        ) : (
          <div className="grid grid-cols-2 gap-4.5">
            {projects.map((project) => {
              const stage = getStageByNumber(project.currentStage);
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-card-md transition-shadow"
                  onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(project.id))}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-(--color-text-primary)">{project.title}</h3>
                    <StageBadge stageNumber={project.currentStage} label={stage.statusLabel} />
                  </div>
                  <p className="text-xs text-(--color-text-secondary) mb-4">{project.location}</p>
                  <ProgressBar percent={project.progressPercent} color={stage.color} showLabel />
                  <p className="text-xs text-(--color-text-secondary) mt-2">
                    Stage {project.currentStage} of 8 · {stage.name}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
