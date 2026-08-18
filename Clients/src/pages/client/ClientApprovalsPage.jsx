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

const STATUS_VARIANT = { pending: "warning", overdue: "danger", internal_review: "info", approved: "success" };

export default function ClientApprovalsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: approvals = [], isLoading } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const [reviewApproval, { isLoading: isReviewing }] = useReviewApprovalMutation();
  const [activeApproval, setActiveApproval] = useState(null);
  const [decision, setDecision] = useState(null); // 'approved' | 'rejected'
  const [comment, setComment] = useState("");

  const clientFacing = approvals.filter((a) => a.status !== "internal_review");

  const openReview = (approval, dec) => {
    setActiveApproval(approval);
    setDecision(dec);
    setComment("");
  };

  const handleConfirm = async () => {
    if (decision === "rejected" && !comment.trim()) {
      dispatch(pushToast("A comment is required when requesting changes", "warning"));
      return;
    }
    try {
      await reviewApproval({ approvalId: activeApproval.id, decision, comment }).unwrap();
      dispatch(
        pushToast(
          decision === "approved" ? "Document approved — team notified" : "Revision requested — team notified",
          "success"
        )
      );
      setActiveApproval(null);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not submit review", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Review & approval" subtitle={`${clientFacing.length} items`} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false}>
          <CardBody>
            {isLoading ? (
              <PageLoader />
            ) : clientFacing.length === 0 ? (
              <EmptyState icon="checklist" title="Nothing to review" description="New documents will appear here when the team sends them for approval." />
            ) : (
              clientFacing.map((a) => (
                <div key={a.id} className="flex items-center gap-4 py-4 border-b border-(--color-border) last:border-0">
                  <div className="w-10 h-10 rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
                    <Icon name="file-text" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-(--color-text-primary)">{a.documentName}</div>
                    <div className="text-xs text-(--color-text-secondary) mt-0.5">
                      Stage {a.stageNumber} · Requested {a.requestedAt}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status] || "neutral"}>{a.status.replace("_", " ")}</Badge>
                  {a.status === "pending" && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openReview(a, "rejected")}>
                        Request changes
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => openReview(a, "approved")}>
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={!!activeApproval}
        onClose={() => setActiveApproval(null)}
        title={decision === "approved" ? "Approve document" : "Request changes"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveApproval(null)}>
              Cancel
            </Button>
            <Button variant={decision === "approved" ? "primary" : "danger"} onClick={handleConfirm} disabled={isReviewing}>
              {isReviewing ? "Submitting…" : decision === "approved" ? "Confirm approval" : "Send revision request"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--color-text-secondary) mb-3">{activeApproval?.documentName}</p>
        <Textarea
          label={decision === "approved" ? "Add a comment (optional)" : "What needs to change?"}
          placeholder={decision === "approved" ? "Looks great, thank you!" : "Please describe what needs to be revised…"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </>
  );
}
