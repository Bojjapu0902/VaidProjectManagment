import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardBody } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import { useGetProjectByIdQuery } from "../../app/api/apiSlice";
import { STAGES } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

export default function ClientProjectTimelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <Topbar title="Project timeline" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false} className="mb-5">
          <CardBody>
            <StageTracker currentStage={project.currentStage} />
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardBody>
            <StageTracker currentStage={project.currentStage} orientation="vertical" />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
