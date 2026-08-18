import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { Select } from "../../components/common/FormField";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import {
  useGetApprovalsQuery,
  useGetDocumentsByProjectQuery,
  useRequestApprovalMutation,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";

const STATUS_VARIANT = {
  pending: "warning",
  overdue: "danger",
  internal_review: "info",
  approved: "success",
};

export default function ApprovalManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: approvals = [], isLoading } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const { data: documents = [] } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const [requestApproval, { isLoading: isRequesting }] = useRequestApprovalMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("");

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
      dispatch(pushToast("Approval request sent for internal review", "success"));
      setIsModalOpen(false);
      setSelectedDocId("");
    } catch (err) {
      dispatch(pushToast(err.message || "Could not create approval request", "danger"));
    }
  };

  return (
    <>
      <Topbar
        title="Approval management"
        subtitle={`${approvals.length} requests on this project`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setIsModalOpen(true)}>
            New request
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

        <Card padded={false}>
          <CardBody>
            {isLoading ? (
              <PageLoader />
            ) : approvals.length === 0 ? (
              <EmptyState icon="checklist" title="No approval requests" description="Create one once stage documents are ready for client review." />
            ) : (
              approvals.map((a) => (
                <div key={a.id} className="flex items-center gap-4 py-4 border-b border-(--color-border) last:border-0">
                  <div className="w-9 h-9 rounded-(--radius-sm) bg-(--color-info-bg) text-(--color-info) flex items-center justify-center flex-shrink-0">
                    <Icon name="file-text" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-(--color-text-primary)">{a.documentName}</div>
                    <div className="text-xs text-(--color-text-secondary) mt-0.5">
                      Requested {a.requestedAt} · Stage {a.stageNumber}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status] || "neutral"}>{a.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-(--color-text-tertiary) w-28 text-right">{a.dueIn}</span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request client approval"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRequest} disabled={!selectedDocId || isRequesting}>
              {isRequesting ? "Sending…" : "Send request"}
            </Button>
          </>
        }
      >
        <Select
          label="Select document to send for approval"
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          options={[
            { value: "", label: "Choose a document…" },
            ...documents.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </Modal>
    </>
  );
}
