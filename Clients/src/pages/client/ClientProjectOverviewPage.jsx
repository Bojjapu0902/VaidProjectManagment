import { useParams, useNavigate, Link } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import ProgressHero from "../../components/client/ProgressHero";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import { useGetProjectByIdQuery } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

export default function ClientProjectOverviewPage() {
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

  const quickLinks = [
    { label: "Timeline", icon: "timeline", to: ROUTES.CLIENT.PROJECT_TIMELINE(id) },
    { label: "Documents", icon: "folders", to: ROUTES.CLIENT.PROJECT_DOCUMENTS(id) },
    { label: "Review & approvals", icon: "checklist", to: ROUTES.CLIENT.PROJECT_APPROVALS(id) },
    { label: "Messages", icon: "message-circle", to: ROUTES.CLIENT.PROJECT_MESSAGES(id) },
  ];

  return (
    <>
      <Topbar title={project.title} subtitle={project.location} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECTS)}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to my projects
        </button>

        <ProgressHero project={project} />

        <div className="grid grid-cols-4 gap-3 mb-5">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-full bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center">
                <Icon name={link.icon} size={17} />
              </div>
              <span className="text-xs font-semibold text-(--color-text-primary)">{link.label}</span>
            </Link>
          ))}
        </div>

        <Card padded={false}>
          <CardHeader title="Lifecycle progress" subtitle={`Stage ${project.currentStage} of 8`} />
          <CardBody>
            <StageTracker currentStage={project.currentStage} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
