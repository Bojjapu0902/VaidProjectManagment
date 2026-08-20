import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import clsx from "clsx";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { StageBadge } from "../../components/common/Badge";
import StageTracker from "../../components/common/StageTracker";
import { TeamMemberRow, DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { PageLoader } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import {
  useGetProjectByIdQuery,
  useGetDocumentsByProjectQuery,
  useGetApprovalsQuery,
  useDeleteProjectMutation,
} from "../../app/api/apiSlice";
import { getStageByNumber, getProjectLifecycleStages } from "../../constants/stages";
import { formatCurrency, formatDate } from "../../utils/format";
import { ROUTES } from "../../constants/routes";
import { ROLES } from "../../constants/roles";

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: documents = [] } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
  const pm = project.team?.find((m) => m.role === "Project Manager");
  // Edit is available to admin and the assigned PM only; other roles see
  // the header without it.
  const canEdit = Boolean(user && (user.role === ROLES.ADMIN || (pm && pm.userId === user.id)));

  const stageDocuments = documents.filter((d) => d.stageNumber === project.currentStage);
  const stageApprovals = approvals.filter((a) => a.stageNumber === project.currentStage);
  const pendingInternal = stageApprovals.filter((a) => a.status === "internal_review" || a.status === "pending");
  // Request client approval is disabled until internal QA has passed.
  const qaClear = pendingInternal.length === 0;

  // Tabs are routes, so any tab is directly linkable — Overview is this
  // page; the rest hand off to their own screens.
  const tabs = [
    { label: "Overview", to: ROUTES.ADMIN.PROJECT_DETAIL(id), active: true },
    { label: "Stages", to: ROUTES.ADMIN.PROJECT_STAGES(id) },
    { label: "Documents", to: ROUTES.ADMIN.PROJECT_DOCUMENTS(id), count: documents.length },
    { label: "Team", to: ROUTES.ADMIN.PROJECT_TEAM(id), count: project.team?.length || 0 },
    { label: "Approvals", to: ROUTES.ADMIN.PROJECT_APPROVALS(id), count: approvals.length },
    { label: "Messages", to: ROUTES.ADMIN.PROJECT_MESSAGES(id) },
  ];

  const handleDelete = async () => {
    try {
      await deleteProject(project.id).unwrap();
      dispatch(pushToast(`${project.title} was archived`, "success"));
      navigate(ROUTES.ADMIN.PROJECTS);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not delete project", "danger"));
    }
  };

  return (
    <>
      <Topbar
        title={project.title}
        subtitle={`${project.projectCode} · ${project.location}`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
      />

      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) hover:text-(--color-text-primary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to projects
        </button>

        {/* Project header — the hub every other project screen hangs off */}
        <Card padded={false} className="mb-5">
          <div className="px-5 md:px-6 py-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-5 flex-wrap">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
                  <Link to={ROUTES.ADMIN.PROJECTS} className="hover:text-(--color-text-primary)">
                    Projects
                  </Link>
                  <span>/</span>
                  <span className="font-mono">{project.projectCode}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-(--color-text-primary)">{project.title}</h1>
                  <StageBadge stageNumber={project.currentStage} label={stage.statusLabel} />
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-(--color-text-secondary)">
                  <span>{project.location}</span>
                  {project.siteArea && (
                    <>
                      <span>·</span>
                      <span>{project.siteArea}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>
                    Client: <strong className="font-semibold text-(--color-text-primary)">{project.clientName}</strong>
                  </span>
                  {pm && (
                    <>
                      <span>·</span>
                      <span>
                        PM: <strong className="font-semibold text-(--color-text-primary)">{pm.name}</strong>
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>
                    {formatCurrency(project.budget.min)} – {formatCurrency(project.budget.max)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {canEdit && (
                  <Button
                    variant="secondary"
                    icon={<Icon name="edit" size={15} />}
                    onClick={() => navigate(`${ROUTES.ADMIN.PROJECT_NEW}?edit=${project.id}`)}
                  >
                    Edit project
                  </Button>
                )}
                <Button
                  variant="secondary"
                  icon={<Icon name="upload" size={15} />}
                  onClick={() => navigate(ROUTES.ADMIN.PROJECT_DOCUMENTS(id))}
                >
                  Upload documents
                </Button>
                {canEdit &&
                  (qaClear ? (
                    <Button
                      variant="accent"
                      icon={<Icon name="send" size={15} />}
                      onClick={() => navigate(ROUTES.ADMIN.PROJECT_APPROVALS(id))}
                    >
                      Request client approval
                    </Button>
                  ) : (
                    <Button variant="accent" disabled title="Internal QA must pass before the client can be asked to approve">
                      {`Request client approval — ${pendingInternal.length} check${pendingInternal.length === 1 ? "" : "s"} outstanding`}
                    </Button>
                  ))}
                <div className="relative">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <Icon name="dots-vertical" size={16} />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div
                        role="menu"
                        className="absolute right-0 top-[42px] z-20 w-56 bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) shadow-card-md py-1.5"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full text-left px-3.5 py-2 text-[13px] text-(--color-danger) hover:bg-(--color-danger-bg) flex items-center gap-2"
                          onClick={() => {
                            setMenuOpen(false);
                            setConfirmDeleteOpen(true);
                          }}
                        >
                          <Icon name="trash" size={14} /> Delete project
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-navigation — the stage bar and these tabs give both
                audiences one shared mental model of where the project is */}
            <nav className="flex items-center gap-5 md:gap-6 overflow-x-auto -mb-px" aria-label="Project sections">
              {tabs.map((tab) => (
                <Link
                  key={tab.label}
                  to={tab.to}
                  className={clsx(
                    "text-[13.5px] pb-2.5 whitespace-nowrap border-b-2 transition-colors",
                    tab.active
                      ? "font-semibold text-(--color-text-primary) border-(--color-navy)"
                      : "text-(--color-text-secondary) border-transparent hover:text-(--color-text-primary)"
                  )}
                >
                  {tab.label}
                  {typeof tab.count === "number" && (
                    <span className="ml-1.5 font-mono text-[11px] text-(--color-text-tertiary)">{tab.count}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </Card>

        <Card padded={false} className="mb-5">
          <CardHeader
            title="Stage progress"
            subtitle={`Stage ${project.currentStage} of ${lifecycleStages.length} · ${project.progressPercent}% overall`}
          />
          <CardBody>
            <StageTracker currentStage={project.currentStage} stages={lifecycleStages} />
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4.5">
          <div className="flex flex-col gap-4.5">
            <Card padded={false}>
              <CardHeader title={`Active stage — ${stage.name}`} subtitle="Description and current-stage activity" />
              <CardBody className="flex flex-col gap-5">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">{project.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--color-border)">
                  <div>
                    <div className="text-xs text-(--color-text-secondary)">Start date</div>
                    <div className="text-sm font-semibold mt-0.5">{formatDate(project.timeline.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-(--color-text-secondary)">Expected completion</div>
                    <div className="text-sm font-semibold mt-0.5">{formatDate(project.timeline.expectedEndDate)}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-(--color-border) flex flex-col gap-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-(--color-text-secondary)">Latest uploads for this stage</span>
                    <Link to={ROUTES.ADMIN.PROJECT_DOCUMENTS(id)} className="text-xs font-semibold text-(--color-navy)">
                      View all
                    </Link>
                  </div>
                  {stageDocuments.length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary) py-1">No documents uploaded for this stage yet.</p>
                  ) : (
                    stageDocuments.slice(0, 4).map((doc) => <DocumentRow key={doc.id} doc={doc} />)
                  )}
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
                {documents.length === 0 ? (
                  <p className="text-sm text-(--color-text-secondary) py-2">No documents uploaded yet.</p>
                ) : (
                  documents.slice(0, 4).map((doc) => <DocumentRow key={doc.id} doc={doc} />)
                )}
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-col gap-4.5">
            <Card padded={false}>
              <CardHeader title="Approval status" />
              <CardBody className="flex flex-col gap-3">
                {stageApprovals.length === 0 ? (
                  <p className="text-sm text-(--color-text-secondary)">No active approval requests for this stage.</p>
                ) : (
                  stageApprovals.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-1.5 border-b border-(--color-border) last:border-0"
                    >
                      <span className="text-[13px] text-(--color-text-primary) truncate">{a.documentName}</span>
                      <StageBadge stageNumber={a.stageNumber} label={a.status.replace("_", " ")} />
                    </div>
                  ))
                )}
                <p className="text-[11.5px] leading-relaxed text-(--color-text-secondary) pt-3 border-t border-(--color-border)">
                  Internal QA must pass before the client can be asked to approve.
                </p>
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Team"
                action={
                  canEdit ? (
                    <Link to={ROUTES.ADMIN.PROJECT_TEAM(id)} className="text-xs font-semibold text-(--color-navy)">
                      Manage
                    </Link>
                  ) : null
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
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--color-text-secondary)">
          Are you sure you want to delete <strong>{project.title}</strong>? This archives the project — it will no longer
          appear in active project lists.
        </p>
      </Modal>
    </>
  );
}
