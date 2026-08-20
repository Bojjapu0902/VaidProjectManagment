import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { Select, Textarea } from "../../components/common/FormField";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import {
  useGetApprovalsQuery,
  useGetDocumentsByProjectQuery,
  useGetProjectByIdQuery,
  useRequestApprovalMutation,
  useReviewApprovalMutation,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";
import { getStageByNumber } from "../../constants/stages";

const STATUS_VARIANT = {
  pending: "warning",
  overdue: "danger",
  internal_review: "info",
  approved: "success",
  rejected: "danger",
  revision_requested: "warning",
};

const STATUS_LABEL = {
  pending: "Awaiting client",
  overdue: "Overdue",
  internal_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested",
};

// A single visual step in the approval chain — the reference spec's core
// idea for this screen: show the approval as a chain, not a status word,
// so the mandatory internal QA gate is always visible.
function ChainStep({ title, subtitle, state, tone = "default" }) {
  const activeColor = tone === "danger" ? "var(--color-danger)" : "var(--color-stage-4)";
  const doneBg = tone === "danger" ? "var(--color-danger)" : "var(--color-success)";

  return (
    <div className="flex items-start gap-3">
      <span
        className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={
          state === "done"
            ? { background: doneBg, color: "#fff" }
            : { border: `2px solid ${state === "active" ? activeColor : "var(--color-border)"}` }
        }
      >
        {state === "done" && <Icon name="check" size={10} strokeWidth={3} />}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[13px] leading-tight"
          style={{
            color: state === "locked" ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
            fontWeight: state === "active" ? 600 : 400,
          }}
        >
          {title}
        </span>
        <span
          className="text-[11.5px] leading-snug"
          style={{
            color:
              state === "locked"
                ? "var(--color-text-tertiary)"
                : state === "active"
                ? activeColor
                : "var(--color-text-secondary)",
          }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
}

// Derives the 4-step chain (upload → internal review → client review → stage
// advance) from the fields the approvals API actually returns. Nothing here
// is invented — statuses map directly to a.status, and the "who's holding
// it" text comes from the project's real client name / the uploading doc.
function buildChainSteps(approval, doc, clientName) {
  const uploadedSubtitle = doc ? `${doc.uploadedBy} · ${doc.createdAt}` : `Requested ${approval.requestedAt}`;
  const steps = [{ title: "Uploaded by the team", subtitle: uploadedSubtitle, state: "done" }];

  if (approval.status === "internal_review") {
    steps.push({
      title: "Internal review — needs an admin or PM",
      subtitle: approval.dueIn || "In progress",
      state: "active",
    });
    steps.push({ title: "Client review", subtitle: "Unlocks once internal review passes", state: "locked" });
    steps.push({ title: "Stage advances", subtitle: "Automatic once the client approves", state: "locked" });
  } else if (approval.status === "pending" || approval.status === "overdue") {
    steps.push({ title: "Internal review", subtitle: "Passed", state: "done" });
    steps.push({
      title: "Client review",
      subtitle:
        approval.status === "overdue"
          ? `Overdue — waiting on ${clientName || "the client"}`
          : `Waiting on ${clientName || "the client"}${approval.dueIn ? ` · ${approval.dueIn}` : ""}`,
      state: "active",
      tone: approval.status === "overdue" ? "danger" : "default",
    });
    steps.push({ title: "Stage advances", subtitle: "Automatic on approval", state: "locked" });
  } else if (approval.status === "approved") {
    steps.push({ title: "Internal review", subtitle: "Passed", state: "done" });
    steps.push({ title: "Client review", subtitle: "Approved", state: "done" });
    steps.push({ title: "Stage advanced", subtitle: "Next stage is open", state: "done" });
  } else {
    // rejected / revision_requested — the team must act before this can move again.
    steps.push({ title: "Internal review", subtitle: "Passed", state: "done" });
    steps.push({
      title: "Client review",
      subtitle: approval.comment ? `Changes requested — "${approval.comment}"` : "Changes requested",
      state: "done",
      tone: "danger",
    });
    steps.push({ title: "Back with the team", subtitle: "Stage reopened for revision", state: "active", tone: "danger" });
  }

  return steps;
}

function OpenApprovalCard({ approval, doc, clientName, onSendToClient, onReturnToTeam, isSubmitting }) {
  const stage = getStageByNumber(approval.stageNumber);
  const steps = buildChainSteps(approval, doc, clientName);

  const borderColor =
    approval.status === "overdue"
      ? "var(--color-danger)"
      : approval.status === "internal_review"
      ? "var(--color-stage-4)"
      : "var(--color-info)";
  const headerBg =
    approval.status === "overdue"
      ? "var(--color-danger-bg)"
      : approval.status === "internal_review"
      ? "var(--color-warning-bg)"
      : "var(--color-info-bg)";

  return (
    <div className="rounded-(--radius-md) overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      <div
        className="px-4.5 py-3.5 flex items-start justify-between gap-3"
        style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-(--color-text-primary) truncate">
            Stage {approval.stageNumber} — {stage.name}
          </span>
          <span className="text-xs text-(--color-text-secondary) truncate">{approval.documentName}</span>
        </div>
        <Badge variant={STATUS_VARIANT[approval.status] || "neutral"}>
          {STATUS_LABEL[approval.status] || approval.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="p-4.5 flex flex-col gap-4">
        <div className="flex flex-col gap-3.5">
          {steps.map((step, i) => (
            <ChainStep key={i} {...step} />
          ))}
        </div>

        {approval.status === "internal_review" && (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-3.5 border-t border-(--color-border)">
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={() => onSendToClient(approval)}
              disabled={isSubmitting}
            >
              Send to client
            </Button>
            <Button
              variant="danger"
              className="justify-center"
              onClick={() => onReturnToTeam(approval)}
              disabled={isSubmitting}
            >
              Return to team
            </Button>
          </div>
        )}

        {(approval.status === "pending" || approval.status === "overdue") && (
          <p className="text-xs text-(--color-text-secondary) pt-3.5 border-t border-(--color-border) leading-relaxed">
            {approval.status === "overdue"
              ? `Overdue — this is with ${clientName || "the client"}, not the team. Follow up from Messages if needed.`
              : `With ${clientName || "the client"} for decision. The stage advances automatically once they approve.`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApprovalManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project } = useGetProjectByIdQuery(id);
  const { data: approvals = [], isLoading } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const { data: documents = [] } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const [requestApproval, { isLoading: isRequesting }] = useRequestApprovalMutation();
  const [reviewApproval, { isLoading: isReviewing }] = useReviewApprovalMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [returningApproval, setReturningApproval] = useState(null);
  const [returnComment, setReturnComment] = useState("");

  const openApprovals = approvals.filter((a) => a.status !== "approved");
  const closedApprovals = approvals.filter((a) => a.status === "approved");

  // One open approval per stage at a time — so a stage that already has an
  // open request isn't offered again in the "request approval" picker.
  const openStageNumbers = new Set(openApprovals.map((a) => a.stageNumber));
  const eligibleDocuments = documents.filter((d) => !openStageNumbers.has(d.stageNumber));

  const handleCreateRequest = async () => {
    const doc = documents.find((d) => d.id === selectedDocId);
    if (!doc) return;
    try {
      await requestApproval({
        projectId: id,
        payload: {
          documentName: doc.name,
          documentId: doc.id,
          stageNumber: doc.stageNumber,
          urgency: "neutral",
        },
      }).unwrap();
      dispatch(pushToast("Sent for internal review", "success"));
      setIsModalOpen(false);
      setSelectedDocId("");
    } catch (err) {
      dispatch(pushToast(err.message || "Could not create approval request", "danger"));
    }
  };

  const handleSendToClient = async (approval) => {
    try {
      await reviewApproval({ approvalId: approval.id, decision: "pending", comment: "" }).unwrap();
      dispatch(pushToast(`Sent to ${project?.clientName || "the client"} for review`, "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not send to client", "danger"));
    }
  };

  const openReturnModal = (approval) => {
    setReturningApproval(approval);
    setReturnComment("");
  };

  const confirmReturn = async () => {
    if (!returningApproval || !returnComment.trim()) return;
    try {
      await reviewApproval({
        approvalId: returningApproval.id,
        decision: "revision_requested",
        comment: returnComment.trim(),
      }).unwrap();
      dispatch(pushToast("Returned to the team — revision requested", "info"));
      setReturningApproval(null);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not return to team", "danger"));
    }
  };

  return (
    <>
      <Topbar
        title="Approval management"
        subtitle={`${openApprovals.length} open, ${closedApprovals.length} closed`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setIsModalOpen(true)}>
            Request approval
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        {isLoading ? (
          <Card padded={false}>
            <PageLoader />
          </Card>
        ) : approvals.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon="checklist"
              title="No approval requests"
              description="Create one once stage documents are ready for internal sign-off."
            />
          </Card>
        ) : (
          <Card padded={false}>
            <CardHeader
              title="Approvals"
              subtitle={`${project?.title || "This project"} · ${openApprovals.length} open, ${closedApprovals.length} closed`}
            />
            <CardBody>
              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 items-start">
                <div className="flex flex-col gap-4">
                  {openApprovals.length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary)">No open approvals right now.</p>
                  ) : (
                    openApprovals.map((a) => (
                      <OpenApprovalCard
                        key={a.id}
                        approval={a}
                        doc={documents.find((d) => d.name === a.documentName)}
                        clientName={project?.clientName}
                        onSendToClient={handleSendToClient}
                        onReturnToTeam={openReturnModal}
                        isSubmitting={isReviewing}
                      />
                    ))
                  )}

                  {closedApprovals.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-(--color-text-primary)">Closed approvals</span>
                      {closedApprovals.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 border border-(--color-border) rounded-(--radius-sm)"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-(--color-text-primary) truncate">
                              Stage {a.stageNumber} — {a.documentName}
                            </div>
                            <div className="text-xs text-(--color-text-secondary) mt-0.5">
                              Requested {a.requestedAt}
                              {a.revisionRound ? ` · ${a.revisionRound} revision round${a.revisionRound > 1 ? "s" : ""}` : ""}
                            </div>
                          </div>
                          <Badge variant="success">Approved</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border border-(--color-border) rounded-(--radius-md) p-4.5 flex flex-col gap-3">
                    <span className="text-sm font-bold text-(--color-text-primary)">Overview</span>
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-(--color-text-secondary)">Awaiting internal review</span>
                        <span className="font-mono text-(--color-text-primary)">
                          {approvals.filter((a) => a.status === "internal_review").length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-(--color-text-secondary)">With the client</span>
                        <span className="font-mono text-(--color-text-primary)">
                          {approvals.filter((a) => a.status === "pending").length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-(--color-danger)">Overdue</span>
                        <span className="font-mono text-(--color-danger)">
                          {approvals.filter((a) => a.status === "overdue").length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-(--color-border)">
                        <span className="text-(--color-text-secondary)">Closed</span>
                        <span className="font-mono text-(--color-text-primary)">{closedApprovals.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) p-4.5 flex flex-col gap-2">
                    <span className="text-sm font-bold text-(--color-text-primary)">How this works</span>
                    <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-(--color-text-secondary) list-disc pl-4">
                      <li>Internal review must pass before the client sees anything.</li>
                      <li>All documents in a request are approved together — no partial approval.</li>
                      <li>Returning a request to the team reopens the stage for revision.</li>
                      <li>Only one approval can be open per stage at a time.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request approval"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRequest}
              disabled={!selectedDocId || isRequesting || eligibleDocuments.length === 0}
            >
              {isRequesting
                ? "Sending…"
                : eligibleDocuments.length === 0
                ? "No eligible documents"
                : !selectedDocId
                ? "Choose a document"
                : "Send request"}
            </Button>
          </>
        }
      >
        {eligibleDocuments.length === 0 ? (
          <p className="text-sm text-(--color-text-secondary) leading-relaxed">
            Every stage with documents already has an open approval. Resolve or close one before starting
            another — only one approval can be open per stage at a time.
          </p>
        ) : (
          <div className="space-y-3">
            <Select
              label="Select document to send for internal review"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              options={[
                { value: "", label: "Choose a document…" },
                ...eligibleDocuments.map((d) => ({ value: d.id, label: `${d.name} — Stage ${d.stageNumber}` })),
              ]}
            />
            <p className="text-xs text-(--color-text-secondary) leading-relaxed">
              This starts internal review. Nothing reaches the client until an admin or PM signs off.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!returningApproval}
        onClose={() => setReturningApproval(null)}
        title="Return to team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturningApproval(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReturn} disabled={isReviewing || !returnComment.trim()}>
              {isReviewing ? "Sending…" : !returnComment.trim() ? "Add a reason to continue" : "Return to team"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-(--color-text-secondary)">{returningApproval?.documentName}</p>
          <Textarea
            label="What needs to change?"
            placeholder="Describe what the team needs to fix before this can be sent to the client…"
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
          />
          <p className="text-xs text-(--color-text-secondary)">
            A reason is required so the team knows what to fix — this can't be sent back empty.
          </p>
        </div>
      </Modal>
    </>
  );
}
