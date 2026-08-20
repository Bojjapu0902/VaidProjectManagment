import { useParams, useNavigate, Link } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import ProgressHero from "../../components/client/ProgressHero";
import { DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery,
  useGetDocumentsByProjectQuery,
  useGetApprovalsQuery,
} from "../../app/api/apiSlice";
import { getProjectLifecycleStages, getStageByNumber } from "../../constants/stages";
import { formatDate } from "../../utils/format";
import { ROUTES } from "../../constants/routes";

// Plain-language summary of what's happening in the current stage — written
// for a first-time client rather than in stage jargon (e.g. "Stage 5: DD
// documentation"). Keyed by stage number, falls back to the stage's status
// label if a project ever lands on a stage number outside this map.
const STAGE_SUMMARIES = {
  1: "The team is finalising the brief — scope, budget and site conditions are being confirmed before design work starts.",
  2: "The team is surveying the site — measurements, photographs and a written analysis of the plot and its constraints.",
  3: "The team is exploring design directions. A small number of concept options will be presented for you to choose between.",
  4: "The team is developing the chosen concept into floor plans, elevations, 3D views and material choices.",
  5: "The team is producing working drawings — the technical set a contractor builds from. Structural and services drawings and the bill of quantities are being finalised alongside them. Nothing on site starts until statutory permissions come through in the next stage.",
  6: "The drawings are with the municipal authority for statutory approval. Nothing on site starts until this permission comes through.",
  7: "The team is supporting construction on site — regular visits, progress reports and quality checks through the build.",
  8: "The team is carrying out the final inspection and preparing handover documents ahead of project completion.",
};

export default function ClientProjectOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: documents = [] } = useGetDocumentsByProjectQuery(
    { projectId: id, clientVisibleOnly: true },
    { skip: !id }
  );
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: id }, { skip: !id });

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  // Walled garden: only stages the studio has marked visible to the client
  // ever render here — a stage the team is running internally-only should
  // never leak onto the client's overview.
  const lifecycleStages = getProjectLifecycleStages(project).filter((s) => s.visibleToClient !== false);
  const currentStageInfo = getStageByNumber(project.currentStage);

  // "internal_review" is QA still inside the studio, never client-facing —
  // excluded from every count shown on this portal.
  const clientFacingApprovals = approvals.filter((a) => a.status !== "internal_review");
  const pendingReview = clientFacingApprovals.filter((a) => a.urgency === "client-action");
  const approvedCount = clientFacingApprovals.filter((a) => a.status === "approved").length;

  const now = new Date();
  const docsAddedThisMonth = documents.filter((d) => {
    const created = new Date(d.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const latestDocuments = [...documents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // The stage checklist reuses the stage's own milestone-style items and
  // marks them done in proportion to the stage's own completion percent —
  // no separate milestone feed exists to query, so this stays honest to
  // the same percent shown everywhere else on the portal.
  const stageItems = currentStageInfo.items || [];
  const doneItemCount = Math.min(
    stageItems.length,
    Math.round((stageItems.length * (project.progressPercent || 0)) / 100)
  );

  const quickLinks = [
    { label: "Timeline", icon: "timeline", to: ROUTES.CLIENT.PROJECT_TIMELINE(id) },
    { label: "Documents", icon: "folders", to: ROUTES.CLIENT.PROJECT_DOCUMENTS(id) },
    { label: "Review & approvals", icon: "checklist", to: ROUTES.CLIENT.PROJECT_APPROVALS(id) },
    { label: "Messages", icon: "message-circle", to: ROUTES.CLIENT.PROJECT_MESSAGES(id) },
  ];

  return (
    <>
      <Topbar
        title={project.title}
        subtitle={project.location}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="message-circle" size={14} />}
              onClick={() => navigate(ROUTES.CLIENT.PROJECT_MESSAGES(id))}
            >
              Message the team
            </Button>
            {pendingReview.length > 0 ? (
              <Button variant="accent" size="sm" onClick={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(id))}>
                {pendingReview.length} approval{pendingReview.length > 1 ? "s" : ""} waiting
              </Button>
            ) : (
              // The approval button becomes a plain status chip once
              // nothing is pending — never left showing a stale "0 waiting".
              <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-success) px-1">
                <Icon name="circle-check" size={14} /> All caught up
              </span>
            )}
          </>
        }
      />
      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECTS)}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to my projects
        </button>

        <ProgressHero project={project} />

        {/* Plain-language stat summary — the client's equivalent of the
            admin hub's headline numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4.5">
          <div className="card p-4.5 flex flex-col gap-1.5">
            <span className="text-xs text-(--color-text-secondary)">Current stage</span>
            <span className="text-[17px] font-semibold text-(--color-text-primary)">{currentStageInfo.shortName}</span>
            <span className="text-[11.5px] text-(--color-info)">
              {project.progressPercent}% · stage {project.currentStage} of {lifecycleStages.length}
            </span>
          </div>
          <div className="card p-4.5 flex flex-col gap-1.5">
            <span className="text-xs text-(--color-text-secondary)">Expected completion</span>
            <span className="text-[17px] font-semibold text-(--color-text-primary)">
              {formatDate(project.timeline.expectedEndDate, "MMMM yyyy")}
            </span>
            <span className="text-[11.5px] text-(--color-text-secondary)">on the current programme</span>
          </div>
          <div className="card p-4.5 flex flex-col gap-1.5">
            <span className="text-xs text-(--color-text-secondary)">Documents shared</span>
            <span className="text-[17px] font-semibold text-(--color-text-primary)">{documents.length} files</span>
            <span className="text-[11.5px] text-(--color-text-secondary)">
              {docsAddedThisMonth > 0 ? `${docsAddedThisMonth} added this month` : "None added this month"}
            </span>
          </div>
          <div className="card p-4.5 flex flex-col gap-1.5">
            <span className="text-xs text-(--color-text-secondary)">Approvals given</span>
            <span className="text-[17px] font-semibold text-(--color-text-primary)">
              {approvedCount} of {clientFacingApprovals.length}
            </span>
            {pendingReview.length > 0 ? (
              <span className="text-[11.5px] text-(--color-amber-dark)">{pendingReview.length} pending your review</span>
            ) : (
              <span className="text-[11.5px] text-(--color-text-secondary)">All reviewed</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 mb-4.5">
          {/* The single most valuable block on the portal for a first-time
              client — plain language, not stage jargon */}
          <Card padded={false}>
            <CardHeader title="What is happening now" />
            <CardBody className="flex flex-col gap-3.5">
              <p className="text-[13px] leading-relaxed text-(--color-text-secondary)">
                {STAGE_SUMMARIES[project.currentStage] || currentStageInfo.statusLabel}
              </p>
              {stageItems.length > 0 && (
                <div className="flex flex-col gap-2 pt-3 border-t border-(--color-border)">
                  {stageItems.map((item, idx) => {
                    const isDone = idx < doneItemCount;
                    return (
                      <div key={item} className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={
                            isDone
                              ? { background: "var(--color-success)", color: "#fff" }
                              : { border: "1.5px solid var(--color-border-strong)" }
                          }
                          aria-hidden="true"
                        >
                          {isDone && <Icon name="check" size={10} strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-[12.5px] ${isDone ? "text-(--color-text-primary)" : "text-(--color-text-secondary)"}`}
                        >
                          {item}
                          <span className="sr-only">{isDone ? " — done" : " — not started yet"}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Only client-visible documents ever appear here, newest first */}
          <Card padded={false}>
            <CardHeader title="Latest documents" />
            <CardBody className="flex flex-col gap-1">
              {latestDocuments.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary) py-2">No documents shared with you yet.</p>
              ) : (
                latestDocuments.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
              )}
              <Link
                to={ROUTES.CLIENT.PROJECT_DOCUMENTS(id)}
                className="text-[12.5px] font-semibold text-(--color-portal-primary) pt-2 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
              >
                Open the document centre →
              </Link>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4.5">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
            >
              <div className="w-9 h-9 rounded-full bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center">
                <Icon name={link.icon} size={17} />
              </div>
              <span className="text-xs font-semibold text-(--color-text-primary)">{link.label}</span>
            </Link>
          ))}
        </div>

        <Card padded={false}>
          <CardHeader
            title="Lifecycle"
            subtitle={`Stage ${project.currentStage} of ${lifecycleStages.length}`}
          />
          <CardBody>
            <StageTracker currentStage={project.currentStage} stages={lifecycleStages} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
