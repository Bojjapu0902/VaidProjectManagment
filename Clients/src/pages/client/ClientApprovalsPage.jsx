import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { Textarea } from "../../components/common/FormField";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import { useGetApprovalsQuery, useReviewApprovalMutation } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";

// Status vocabulary matches the workflow's real state machine (see
// sec-approval in the reference doc): pending/overdue wait on the client,
// approved/revision_requested are the two terminal decisions. "Rejected"
// is never produced from this screen — a client always requests changes
// with a reason, never a bare rejection.
const STATUS_VARIANT = {
  pending: "warning",
  overdue: "danger",
  internal_review: "info",
  approved: "success",
  revision_requested: "danger",
};

const STATUS_LABEL = {
  pending: "Awaiting your decision",
  overdue: "Overdue — decision needed",
  internal_review: "In internal review",
  approved: "Approved",
  revision_requested: "Changes requested",
};

export default function ClientApprovalsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: approvals = [], isLoading } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const [reviewApproval, { isLoading: isReviewing }] = useReviewApprovalMutation();
  const [activeApproval, setActiveApproval] = useState(null);
  const [decision, setDecision] = useState(null); // 'approved' | 'revision_requested'
  const [comment, setComment] = useState("");

  // Nothing pending internal QA is ever shown or actionable here — only
  // documents that have already passed internal review reach the client.
  const clientFacing = approvals.filter((a) => a.status !== "internal_review");
  const awaitingDecision = clientFacing.filter((a) => a.status === "pending" || a.status === "overdue");

  const openReview = (approval, dec) => {
    setActiveApproval(approval);
    setDecision(dec);
    setComment("");
  };

  const needsComment = decision === "revision_requested";
  const commentMissing = needsComment && !comment.trim();

  const handleConfirm = async () => {
    if (commentMissing) return; // hard guard — the button is disabled for this case too
    try {
      await reviewApproval({ approvalId: activeApproval.id, decision, comment: comment.trim() }).unwrap();
      dispatch(
        pushToast(
          decision === "approved"
            ? "Approved — the team has been notified and the next stage is opening"
            : "Changes requested — sent back to the team with your note",
          "success"
        )
      );
      setActiveApproval(null);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not submit your decision", "danger"));
    }
  };

  return (
    <>
      <Topbar
        title="Review & approval"
        subtitle={`${awaitingDecision.length} awaiting your decision · ${clientFacing.length} total`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
      />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false}>
          <CardHeader
            title="Approvals"
            subtitle="Each request covers every document sent together — approving accepts the whole set; you can't approve part of one."
          />
          <CardBody>
            {isLoading ? (
              <PageLoader />
            ) : clientFacing.length === 0 ? (
              <EmptyState
                icon="checklist"
                title="Nothing to review"
                description="New documents will appear here once the team's internal review has passed."
              />
            ) : (
              clientFacing.map((a) => {
                const canDecide = a.status === "pending" || a.status === "overdue";
                return (
                  <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 border-b border-(--color-border) last:border-0"
                  >
                    <div className="w-10 h-10 rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
                      <Icon name="file-text" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-(--color-text-primary)">{a.documentName}</div>
                      <div className="text-xs text-(--color-text-secondary) mt-0.5">
                        Stage {a.stageNumber} · Sent {a.requestedAt}
                        {a.dueIn ? ` · ${a.dueIn}` : ""}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[a.status] || "neutral"}>{STATUS_LABEL[a.status] || a.status.replace(/_/g, " ")}</Badge>
                    {canDecide && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="danger" size="sm" onClick={() => openReview(a, "revision_requested")}>
                          Request changes
                        </Button>
                        <Button variant="approve" size="sm" onClick={() => openReview(a, "approved")}>
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={!!activeApproval}
        onClose={() => setActiveApproval(null)}
        title={decision === "approved" ? "Approve documents" : "Request changes"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveApproval(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === "approved" ? "approve" : "danger"}
              onClick={handleConfirm}
              disabled={isReviewing || commentMissing}
            >
              {isReviewing
                ? "Submitting…"
                : commentMissing
                ? "Add a comment to continue"
                : decision === "approved"
                ? "Confirm approval"
                : "Send revision request"}
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-(--color-text-primary) mb-1">{activeApproval?.documentName}</p>
        <p className="text-xs text-(--color-text-secondary) mb-3">
          Stage {activeApproval?.stageNumber} · this decision applies to every document sent in this request.
        </p>
        <Textarea
          label={decision === "approved" ? "Add a comment (optional)" : "What needs to change?"}
          placeholder={decision === "approved" ? "Looks great, thank you!" : "Please describe what needs to be revised…"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="text-[11.5px] text-(--color-text-secondary) mt-2 leading-relaxed">
          {decision === "approved"
            ? "Approving records your name, the document versions and the time, and moves this stage forward — it doesn't affect the rest of the project."
            : "A short note is required so the team knows exactly what to revise — this can't be sent without one."}
        </p>
      </Modal>
    </>
  );
}
