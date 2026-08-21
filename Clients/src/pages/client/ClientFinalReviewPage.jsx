import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { Textarea } from "../../components/common/FormField";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery, useSubmitFinalReviewMutation,
  useGetDocumentsByProjectQuery, useGetApprovalsQuery,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";
import { getStageByNumber } from "../../constants/stages";

// Two kinds of item, on purpose: the first pair is already confirmed by the
// team (read-only, informational) and the second pair are the client's own
// receipt acknowledgements — those are the only ones gating submission.
const COMPLETED_ITEMS = [
  { label: "Final inspection attended and accepted", detail: "Confirmed by your project team" },
  { label: "Snag list closed", detail: "All items raised have been verified fixed" },
];

const RECEIPT_ITEMS = [
  "I have received the as-built drawings",
  "I have received warranties and maintenance documents",
];

function StarRating({ value = 0, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={readOnly ? "cursor-default" : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded"}
        >
          <Icon
            name="star"
            size={26}
            className={star <= value ? "text-(--color-amber)" : "text-(--color-border-strong)"}
            style={{ fill: star <= value ? "var(--color-amber)" : "none" }}
          />
        </button>
      ))}
      <span className="text-xs text-(--color-text-secondary) ml-1">
        {value ? `${value} of 5` : "Not rated yet"}
      </span>
    </div>
  );
}

function monthsBetween(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(months, 0);
}

export default function ClientFinalReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: documents = [] } = useGetDocumentsByProjectQuery(
    { projectId: id, clientVisibleOnly: true },
    { skip: !id }
  );
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const [submitFinalReview, { isLoading: isSubmitting }] = useSubmitFinalReviewMutation();
  const [checked, setChecked] = useState({});
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  // Local, session-scoped record of a just-completed submission. The mock
  // API doesn't persist rating/feedback back onto the project, so this is
  // what lets the screen flip to a read-only completion record without an
  // immediate redirect, matching "after confirmation the screen becomes a
  // read-only completion record with the timestamp".
  const [submittedRecord, setSubmittedRecord] = useState(null);

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const backButton = (
    <button
      onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
      className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
    >
      <Icon name="arrow-left" size={14} /> Back to project
    </button>
  );

  // Reachable only at stage 8 — every earlier stage explains plainly why
  // there's nothing to review yet, rather than rendering a broken/empty form.
  if (project.currentStage !== 8) {
    const stage = getStageByNumber(project.currentStage);
    return (
      <>
        <Topbar title="Final review & feedback" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <div className="p-8 flex-1 overflow-y-auto max-w-xl">
          {backButton}
          <Card>
            <EmptyState
              icon="circle-check"
              title="Final review opens once the project reaches completion"
              description={`This project is currently at stage ${project.currentStage} of 8 — ${stage.name}. Sign-off, rating and feedback become available once your project team marks stage 8, Final review & submission, complete.`}
              action={
                <Button variant="secondary" onClick={() => navigate(ROUTES.CLIENT.PROJECT_TIMELINE(id))}>
                  View project timeline
                </Button>
              }
            />
          </Card>
        </div>
      </>
    );
  }

  const receiptsChecked = RECEIPT_ITEMS.every((item) => checked[item]);
  const canSubmit = receiptsChecked && rating > 0 && !isSubmitting;
  const documentsShared = documents.length;
  const approvalsGiven = approvals.filter((a) => a.status === "approved").length;
  const durationMonths = monthsBetween(project.timeline?.startDate, project.timeline?.expectedEndDate);

  const handleSubmit = async () => {
    try {
      await submitFinalReview({
        projectId: id,
        payload: { rating, feedback, checklist: RECEIPT_ITEMS.filter((item) => checked[item]) },
      }).unwrap();
      setSubmittedRecord({ rating, feedback, submittedAt: new Date().toISOString() });
      dispatch(pushToast("Thank you — your final review has been submitted.", "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not submit your review", "danger"));
    }
  };

  const handleDownload = () => dispatch(pushToast("Handover package download started.", "success"));

  // A one-time, terminal action — once it's been confirmed this session,
  // the screen becomes a read-only completion record instead of a form
  // that could be submitted again.
  const isReviewed = !!submittedRecord || project.status === "completed";

  if (isReviewed) {
    const record = submittedRecord || { rating: project.rating, feedback: project.feedback, submittedAt: project.finalReviewSubmittedAt };
    return (
      <>
        <Topbar title="Final review & feedback" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <div className="p-8 flex-1 overflow-y-auto max-w-xl">
          {backButton}
          <Card padded={false}>
            <CardHeader
              title="Project complete"
              subtitle={
                record.submittedAt
                  ? `Confirmed ${new Date(record.submittedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Confirmed"
              }
            />
            <CardBody className="space-y-5">
              <div className="flex items-center gap-2">
                <Icon name="circle-check" size={18} className="text-(--color-success) flex-shrink-0" />
                <span className="text-sm font-semibold text-(--color-text-primary)">
                  Handover confirmed — this record is now read-only
                </span>
              </div>
              <div>
                <div className="text-xs text-(--color-text-secondary) mb-2">Your rating</div>
                <StarRating value={record.rating || 0} readOnly />
              </div>
              {record.feedback && (
                <div>
                  <div className="text-xs text-(--color-text-secondary) mb-2">Your feedback</div>
                  <p className="text-sm text-(--color-text-primary) leading-relaxed bg-(--color-bg) rounded-(--radius-md) p-3.5">
                    {record.feedback}
                  </p>
                </div>
              )}
              <p className="text-[11.5px] text-(--color-text-secondary) leading-relaxed">
                Your rating is visible to Vaid only and is never published. The handover package stays
                available in your document centre indefinitely.
              </p>
              <Button variant="secondary" icon={<Icon name="download" size={15} />} onClick={handleDownload}>
                Download handover package
              </Button>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Final review & feedback" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto max-w-xl">
        {backButton}

        <div
          className="rounded-(--radius-lg) p-6 text-white relative overflow-hidden mb-4.5"
          style={{ background: "linear-gradient(135deg, var(--color-portal-primary) 0%, var(--color-portal-primary-dark) 100%)" }}
        >
          <div
            className="absolute -right-10 -top-10 w-[160px] h-[160px] rounded-full bg-white/6"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                Stage 8 · Final review &amp; submission
              </div>
              <div className="text-lg font-bold mt-1">{project.title} is complete</div>
              <p className="text-[13px] text-white/80 mt-1.5 max-w-md leading-relaxed">
                Confirm the checklist below to close the project and release your handover package.
              </p>
            </div>
            <span className="flex-shrink-0 bg-white/18 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              100% COMPLETE
            </span>
          </div>
        </div>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="Final confirmation checklist" />
          <CardBody className="space-y-3">
            {COMPLETED_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start gap-3 pb-3 border-b border-(--color-border)">
                <span
                  className="w-[18px] h-[18px] flex-none rounded-(--radius-sm) bg-(--color-portal-primary) text-white flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  <Icon name="check" size={11} strokeWidth={2.5} />
                </span>
                <div>
                  <div className="text-sm text-(--color-text-primary)">{item.label}</div>
                  <div className="text-[11.5px] text-(--color-text-secondary) mt-0.5">{item.detail}</div>
                </div>
              </div>
            ))}
            {RECEIPT_ITEMS.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 px-3 py-2.5 rounded-(--radius-md) bg-(--color-bg) cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checked[item]}
                  onChange={() => setChecked((prev) => ({ ...prev, [item]: !prev[item] }))}
                  className="rounded"
                />
                <span className="text-sm font-medium text-(--color-text-primary)">{item}</span>
              </label>
            ))}
          </CardBody>
        </Card>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="Handover package" />
          <CardBody>
            <div className="flex items-center justify-between gap-3 border border-(--color-border) rounded-(--radius-md) p-3.5 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
                  <Icon name="folder" size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-(--color-text-primary) truncate">
                    {project.title} — handover package
                  </div>
                  <div className="text-[11.5px] text-(--color-text-secondary)">
                    As-built drawings, warranties and the completion report
                  </div>
                </div>
              </div>
              <Button variant="primary" size="sm" icon={<Icon name="download" size={14} />} onClick={handleDownload}>
                Download
              </Button>
            </div>
            <p className="text-[11.5px] text-(--color-text-secondary) mt-2.5 leading-relaxed">
              The package stays available in your document centre after the project closes.
            </p>
          </CardBody>
        </Card>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="How did we do?" />
          <CardBody className="space-y-4">
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              label="Anything you would like to tell us"
              placeholder="Tell us about your experience working with the team…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </CardBody>
        </Card>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="Project record" />
          <CardBody className="space-y-2">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-(--color-text-secondary)">Duration</span>
              <span className="font-mono text-(--color-text-primary)">
                {durationMonths != null ? `${durationMonths} months` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-(--color-text-secondary)">Approvals given</span>
              <span className="font-mono text-(--color-text-primary)">{approvalsGiven}</span>
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-(--color-text-secondary)">Documents shared</span>
              <span className="font-mono text-(--color-text-primary)">{documentsShared} files</span>
            </div>
          </CardBody>
        </Card>

        <div className="pb-8">
          <Button variant="primary" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            {isSubmitting ? "Submitting…" : "Confirm completion & submit feedback"}
          </Button>
          <p className="text-[11.5px] text-(--color-text-secondary) leading-relaxed mt-2.5">
            Confirming marks the project complete and notifies the studio. Your rating is visible to Vaid
            only and is never published.
          </p>
          {!canSubmit && !isSubmitting && (
            <p className="text-[11.5px] text-(--color-warning) leading-relaxed mt-1.5 flex items-center gap-1.5">
              <Icon name="alert-triangle" size={12} className="flex-shrink-0" />
              {!receiptsChecked
                ? "Tick both receipt items above to continue."
                : "Choose a star rating to continue."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
