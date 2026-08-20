import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardBody } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import StageTracker from "../../components/common/StageTracker";
import ProgressBar from "../../components/common/ProgressBar";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery,
  useGetDocumentsByProjectQuery,
  useGetApprovalsQuery,
} from "../../app/api/apiSlice";
import { getProjectLifecycleStages } from "../../constants/stages";
import { formatDate } from "../../utils/format";
import { ROUTES } from "../../constants/routes";

// Short, plain-language clause per stage — what actually happens, not the
// internal stage jargon ("Stage 5: DD documentation").
const STAGE_BLURBS = {
  1: "brief agreed, scope and budget signed off",
  2: "site visit, measurements and a written site analysis",
  3: "concept options presented and a design direction chosen",
  4: "floor plans, elevations, 3D views and material selection developed",
  5: "working drawings, structural and services sets, bill of quantities",
  6: "submission to the municipal authority for statutory approval",
  7: "site visits and progress reports through construction",
  8: "final inspection, handover documents and completion report",
};

const STATUS_META = {
  completed: { label: "Completed", variant: "success" },
  in_progress: { label: "In progress", variant: "info" },
  upcoming: { label: "Upcoming", variant: "neutral" },
};

// Builds the client-facing, stage-by-stage read of the whole engagement.
// The app has no per-stage date/document backend yet, so stage windows are
// spread evenly across the project's own start/expected-end range — the
// same approach already used on the admin side (Stage management) — while
// document counts, revision rounds and pending approvals are read from the
// real, already-fetched documents/approvals for this project.
function buildTimelineStages(project, documents, approvals) {
  const lifecycleStages = getProjectLifecycleStages(project).filter((s) => s.visibleToClient !== false);
  const start = new Date(project.timeline?.startDate || Date.now());
  const end = new Date(project.timeline?.expectedEndDate || Date.now());
  const totalMs = Math.max(end.getTime() - start.getTime(), lifecycleStages.length * 86400000);
  const perStageMs = totalMs / lifecycleStages.length;

  return lifecycleStages.map((s, idx) => {
    const stageStart = new Date(start.getTime() + idx * perStageMs);
    const stageTarget = new Date(start.getTime() + (idx + 1) * perStageMs);
    const stageDocs = documents.filter((d) => d.stageNumber === s.number);
    const stageApprovals = approvals.filter((a) => a.stageNumber === s.number);
    const maxVersion = stageDocs.reduce((max, d) => Math.max(max, d.version || 1), 1);
    const approvedEntry = stageApprovals.find((a) => a.status === "approved");
    const pendingClientApprovals = stageApprovals.filter(
      (a) => a.urgency === "client-action" && a.status !== "approved"
    );

    return {
      number: s.number,
      name: s.shortName,
      color: s.color,
      status: s.number < project.currentStage ? "completed" : s.number === project.currentStage ? "in_progress" : "upcoming",
      blurb: STAGE_BLURBS[s.number] || "",
      startDate: stageStart,
      targetDate: stageTarget,
      docCount: stageDocs.length,
      // Stated plainly rather than hidden — a bounced-back revision round
      // is the honest reason a stage's dates slipped, not something to
      // paper over.
      revisionRounds: maxVersion > 1 ? maxVersion - 1 : 0,
      approvedAt: approvedEntry?.reviewedAt || null,
      pendingApprovalCount: pendingClientApprovals.length,
    };
  });
}

export default function ClientProjectTimelinePage() {
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

  const timelineStages = buildTimelineStages(project, documents, approvals);
  const completedCount = timelineStages.filter((s) => s.status === "completed").length;
  const inProgressCount = timelineStages.filter((s) => s.status === "in_progress").length;

  return (
    <>
      <Topbar title="Project timeline" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        {/* Quick horizontal glance — scrolls at narrow widths */}
        <Card padded={false} className="mb-4.5">
          <CardBody>
            <StageTracker currentStage={project.currentStage} stages={timelineStages.map((s) => ({ number: s.number, shortName: s.name, color: s.color }))} />
          </CardBody>
        </Card>

        {/* The whole engagement in one vertical read — works identically on
            a phone, carries a sentence of explanation per stage, and shows
            future stages honestly as estimates */}
        <Card padded={false}>
          <div className="px-5 sm:px-6.5 py-5 border-b border-(--color-border) flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg sm:text-xl font-bold text-(--color-text-primary)">Project timeline</span>
              <span className="text-[13px] text-(--color-text-secondary)">
                {project.title} · {completedCount} stage{completedCount === 1 ? "" : "s"} complete
                {inProgressCount > 0 ? `, ${inProgressCount} in progress` : ""}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="download" size={14} />}
              onClick={() => window.print()}
            >
              Download as PDF
            </Button>
          </div>

          <CardBody className="flex flex-col gap-0">
            {timelineStages.map((stage, idx) => {
              const meta = STATUS_META[stage.status];
              const isLast = idx === timelineStages.length - 1;
              const nodeFilled = stage.status !== "upcoming";
              return (
                <div key={stage.number} className="grid grid-cols-[34px_1fr] gap-3.5 sm:gap-4.5">
                  <div className="flex flex-col items-center">
                    <span
                      className="w-[34px] h-[34px] flex-none rounded-full flex items-center justify-center text-[13px] font-bold"
                      style={{
                        background: nodeFilled ? stage.color : "var(--color-bg)",
                        color: nodeFilled ? "#fff" : "var(--color-text-tertiary)",
                      }}
                    >
                      {stage.status === "completed" ? <Icon name="check" size={15} /> : stage.number}
                    </span>
                    {!isLast && (
                      <span
                        className="flex-1 w-0.5 my-0.5"
                        style={{ background: stage.status === "completed" ? "var(--color-success)" : "var(--color-border)", minHeight: 28 }}
                      />
                    )}
                  </div>

                  <div className={`flex flex-col gap-2 ${isLast ? "pb-1" : "pb-6"}`}>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-[15px] sm:text-base font-semibold ${
                          stage.status === "upcoming" ? "text-(--color-text-tertiary)" : "text-(--color-text-primary)"
                        }`}
                      >
                        {stage.name}
                      </span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>

                    <span
                      className={`text-[12.5px] leading-relaxed ${
                        stage.status === "upcoming" ? "text-(--color-text-tertiary)" : "text-(--color-text-secondary)"
                      }`}
                    >
                      {stage.status === "upcoming" ? (
                        <>Expected {formatDate(stage.targetDate, "MMMM yyyy")} · {stage.blurb}</>
                      ) : (
                        <>
                          {formatDate(stage.startDate, "dd MMM")} – {formatDate(stage.targetDate, "dd MMM yyyy")} · {stage.blurb}
                          {stage.revisionRounds > 0 && (
                            <> · {stage.revisionRounds} revision round{stage.revisionRounds > 1 ? "s" : ""} on this stage</>
                          )}
                        </>
                      )}
                    </span>

                    {stage.status !== "upcoming" && stage.docCount > 0 && (
                      <span className="text-[12.5px] font-medium text-(--color-portal-primary)">
                        {stage.docCount} document{stage.docCount > 1 ? "s" : ""}
                      </span>
                    )}

                    {stage.status === "in_progress" && (
                      <div className="max-w-[420px] mt-1">
                        <ProgressBar percent={project.progressPercent || 0} color={stage.color} />
                      </div>
                    )}

                    {stage.status === "in_progress" && stage.pendingApprovalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.CLIENT.PROJECT_APPROVALS(id))}
                        className="flex items-center justify-between gap-3 text-left px-3.5 py-3 mt-1 rounded-(--radius-md) max-w-[520px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                        style={{ border: "1px solid var(--color-amber)", background: "var(--color-amber-light)" }}
                      >
                        <span className="text-[12.5px] text-(--color-text-primary)">
                          {stage.pendingApprovalCount} drawing{stage.pendingApprovalCount > 1 ? "s are" : " is"} waiting for your approval
                        </span>
                        <span className="text-xs font-semibold text-(--color-amber-dark) flex-shrink-0">Review →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
