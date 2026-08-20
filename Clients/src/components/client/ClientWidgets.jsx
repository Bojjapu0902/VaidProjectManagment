import clsx from "clsx";
import Icon from "../common/Icon";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { Badge, StageBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { useGetApprovalsQuery } from "../../app/api/apiSlice";
import { getStageByNumber } from "../../constants/stages";
import { formatDate } from "../../utils/format";

export function ReviewQueueList({ approvals = [], onReview }) {
  if (approvals.length === 0) {
    return <p className="text-sm text-(--color-text-secondary) py-6 text-center">Nothing needs your review right now.</p>;
  }
  return (
    <div>
      {approvals.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
          <div className="w-8 h-8 rounded-(--radius-sm) bg-(--color-amber-light) text-(--color-amber-dark) flex items-center justify-center flex-shrink-0">
            <Icon name="clipboard-check" size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">
              {item.documentName}
            </div>
            <div className="text-[11.5px] text-(--color-text-secondary) mt-0.5">
              Uploaded {item.requestedAt}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => onReview?.(item)}>
            Review
          </Button>
        </div>
      ))}
    </div>
  );
}

// DWG/RVT files have no in-browser renderer — the reference spec and
// INSTRUCTIONS.md both flag this as an open question, so rather than wire a
// preview that will just fail, these types get a clear "download to view"
// affordance and the preview control explains itself instead of dead-ending.
const NON_PREVIEWABLE_TYPES = new Set(["dwg", "rvt"]);

export function DocumentRow({ doc, onView, onDownload }) {
  const fileType = doc.fileType?.toLowerCase();
  const isPreviewable = !NON_PREVIEWABLE_TYPES.has(fileType);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
      <div className="w-[34px] h-[34px] rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
        <Icon name={doc.category === "photo" ? "photo" : doc.category === "drawing" ? "blueprint" : "file-text"} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">{doc.name}</div>
        <div className="text-[11.5px] text-(--color-text-secondary)">
          {doc.fileType?.toUpperCase()} · {doc.fileSize} · v{doc.version || 1}
          {!isPreviewable && <span> · download to view</span>}
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {isPreviewable ? (
          <button
            className="text-(--color-text-secondary) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
            onClick={() => onView?.(doc)}
            aria-label={`View ${doc.name}`}
          >
            <Icon name="eye" size={16} />
          </button>
        ) : (
          <span
            className="text-(--color-text-tertiary) cursor-not-allowed"
            title={`${doc.fileType?.toUpperCase()} files can't be previewed in the browser — download it to open in your CAD software`}
            aria-label={`Preview unavailable for ${doc.name} — download to view`}
          >
            <Icon name="eye" size={16} />
          </span>
        )}
        <button
          className="text-(--color-text-secondary) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
          onClick={() => onDownload?.(doc)}
          aria-label={`Download ${doc.name}`}
        >
          <Icon name="download" size={16} />
        </button>
      </div>
    </div>
  );
}

// Card used on "My projects" (SCR-18) — a repeat client's multi-project
// grid. Skipped entirely on that page when the client has only one project
// (the dashboard is enough); each card fetches its own action count so the
// badge mirrors the dashboard's amber banner rule (client-action approvals
// only, never internal review items).
export function ProjectSummaryCard({ project, onOpen }) {
  const stage = getStageByNumber(project.currentStage);
  const isComplete = project.progressPercent >= 100;
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: project.id }, { skip: isComplete });
  const actionCount = approvals.filter((a) => a.urgency === "client-action").length;
  const stripeColor = isComplete ? "var(--color-success)" : stage.color;

  const handleOpen = () => onOpen?.(project);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={clsx(
        "card overflow-hidden cursor-pointer transition-shadow hover:shadow-card-md flex flex-col",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-portal-primary) focus-visible:ring-offset-2",
        isComplete && "opacity-85"
      )}
    >
      <span className="h-1 block flex-shrink-0" style={{ background: stripeColor }} aria-hidden="true" />
      <div className="p-5 flex flex-col gap-3.5 flex-1">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-(--color-text-primary) truncate">{project.title}</h3>
            <p className="text-xs text-(--color-text-secondary) mt-0.5 truncate">
              {project.location}
              {project.type ? ` · ${project.type}` : ""}
            </p>
          </div>
          {isComplete ? (
            <Badge variant="success">Complete</Badge>
          ) : (
            <StageBadge stageNumber={project.currentStage} label={`Stage ${project.currentStage}`} />
          )}
        </div>

        <div>
          <ProgressBar percent={project.progressPercent} color={stripeColor} />
          <div className="flex justify-between text-[11.5px] text-(--color-text-secondary) mt-1.5">
            <span>{isComplete ? `Handed over ${formatDate(project.timeline?.expectedEndDate, "MMM yyyy")}` : stage.shortName}</span>
            <span className="font-mono">{project.progressPercent}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-(--color-border) mt-auto">
          {isComplete ? (
            <span className="text-[11.5px] text-(--color-text-secondary)">Handover package available</span>
          ) : actionCount > 0 ? (
            <span className="font-mono text-[10px] font-semibold px-2 py-1 rounded-full bg-(--color-amber-light) text-(--color-amber-dark)">
              {actionCount} ACTION{actionCount > 1 ? "S" : ""}
            </span>
          ) : (
            <span className="text-[11.5px] text-(--color-text-secondary)">Nothing needed from you</span>
          )}
          <span className="text-[12.5px] font-medium text-(--color-portal-primary)">Open →</span>
        </div>
      </div>
    </div>
  );
}

export function TeamMemberRow({ member }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Avatar initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} size="sm" />
      <div>
        <div className="text-[13px] font-semibold text-(--color-text-primary)">{member.name}</div>
        <div className="text-[11.5px] text-(--color-text-secondary)">{member.role}</div>
      </div>
    </div>
  );
}
