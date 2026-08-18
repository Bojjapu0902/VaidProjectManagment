import { useParams, useNavigate, Link } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { StageBadge } from "../../components/common/Badge";
import StageTracker from "../../components/common/StageTracker";
import { TeamMemberRow } from "../../components/client/ClientWidgets";
import { DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery,
  useGetDocumentsByProjectQuery,
  useGetApprovalsQuery,
} from "../../app/api/apiSlice";
import { getStageByNumber, getProjectLifecycleStages } from "../../constants/stages";
import { formatCurrency, formatDate } from "../../utils/format";
import { ROUTES } from "../../constants/routes";

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: documents = [] } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: id }, { skip: !id });

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading project…" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const stage = getStageByNumber(project.currentStage);
  const lifecycleStages = getProjectLifecycleStages(project);

  const quickLinks = [
    { label: "Stage management", icon: "timeline", to: ROUTES.ADMIN.PROJECT_STAGES(id) },
    { label: "Documents", icon: "folders", to: ROUTES.ADMIN.PROJECT_DOCUMENTS(id) },
    { label: "Team", icon: "users", to: ROUTES.ADMIN.PROJECT_TEAM(id) },
    { label: "Approvals", icon: "checklist", to: ROUTES.ADMIN.PROJECT_APPROVALS(id) },
    { label: "Messages", icon: "message-circle", to: ROUTES.ADMIN.PROJECT_MESSAGES(id) },
  ];

  return (
    <>
      <Topbar
        title={project.title}
        subtitle={`${project.projectCode} · ${project.location}`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="secondary" icon={<Icon name="edit" size={15} />}>
            Edit project
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to projects
        </button>

        <div className="flex items-center gap-3 mb-5">
          <StageBadge stageNumber={project.currentStage} label={stage.statusLabel} />
          <span className="text-sm text-(--color-text-secondary)">
            Client: <span className="font-semibold text-(--color-text-primary)">{project.clientName}</span>
          </span>
          <span className="text-sm text-(--color-text-secondary)">
            Budget:{" "}
            <span className="font-semibold text-(--color-text-primary)">
              {formatCurrency(project.budget.min)} – {formatCurrency(project.budget.max)}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-5">
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

        <Card padded={false} className="mb-5">
          <CardHeader
            title="Lifecycle progress"
            subtitle={`Stage ${project.currentStage} of ${lifecycleStages.length}`}
          />
          <CardBody>
            <StageTracker currentStage={project.currentStage} stages={lifecycleStages} />
          </CardBody>
        </Card>

        <div className="grid grid-cols-[1.5fr_1fr] gap-4.5">
          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader title="Project description" />
              <CardBody>
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">{project.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-(--color-border)">
                  <div>
                    <div className="text-xs text-(--color-text-secondary)">Start date</div>
                    <div className="text-sm font-semibold mt-0.5">{formatDate(project.timeline.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-(--color-text-secondary)">Expected completion</div>
                    <div className="text-sm font-semibold mt-0.5">{formatDate(project.timeline.expectedEndDate)}</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Recent documents"
                action={
                  <Link to={ROUTES.ADMIN.PROJECT_DOCUMENTS(id)} className="text-xs font-semibold text-(--color-navy)">
                    View all
                  </Link>
                }
              />
              <CardBody>
                {documents.slice(0, 4).map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </CardBody>
            </Card>
          </div>

          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader
                title="Project team"
                action={
                  <Link to={ROUTES.ADMIN.PROJECT_TEAM(id)} className="text-xs font-semibold text-(--color-navy)">
                    Manage
                  </Link>
                }
              />
              <CardBody>
                {project.team.map((member) => (
                  <TeamMemberRow key={member.userId} member={member} />
                ))}
                {project.team.length === 0 && (
                  <p className="text-sm text-(--color-text-secondary) py-2">No team members assigned yet.</p>
                )}
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Approval status"
                action={
                  <Link to={ROUTES.ADMIN.PROJECT_APPROVALS(id)} className="text-xs font-semibold text-(--color-navy)">
                    View
                  </Link>
                }
              />
              <CardBody>
                {approvals.length === 0 ? (
                  <p className="text-sm text-(--color-text-secondary)">No active approval requests.</p>
                ) : (
                  approvals.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-(--color-border) last:border-0">
                      <span className="text-[13px] text-(--color-text-primary)">{a.documentName}</span>
                      <StageBadge stageNumber={a.stageNumber} label={a.status.replace("_", " ")} />
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
