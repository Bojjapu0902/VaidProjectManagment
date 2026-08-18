import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import FileUpload from "../../components/common/FileUpload";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import { useGetDocumentsByProjectQuery, useUploadDocumentMutation } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";

const CATEGORY_TABS = [
  { key: "all", label: "All documents" },
  { key: "drawing", label: "Drawings" },
  { key: "report", label: "Reports" },
  { key: "photo", label: "Photos" },
];

export default function DocumentManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: documents = [], isLoading } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isClientVisible, setIsClientVisible] = useState(true);

  const filtered = activeTab === "all" ? documents : documents.filter((d) => d.category === activeTab);

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    try {
      await Promise.all(
        pendingFiles.map((file) =>
          uploadDocument({
            projectId: id,
            payload: {
              name: file.name,
              category: "report",
              fileType: file.name.split(".").pop(),
              fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              isClientVisible,
              uploadedBy: "You",
              createdAt: new Date().toISOString().slice(0, 10),
            },
          }).unwrap()
        )
      );
      dispatch(pushToast(`${pendingFiles.length} document(s) uploaded`, "success"));
      setIsModalOpen(false);
      setPendingFiles([]);
    } catch (err) {
      dispatch(pushToast(err.message || "Upload failed", "danger"));
    }
  };

  return (
    <>
      <Topbar
        title="Document management"
        subtitle={`${documents.length} documents`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="upload" size={15} />} onClick={() => setIsModalOpen(true)}>
            Upload documents
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

        <div className="flex gap-2 mb-5">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-(--radius-md) text-xs font-semibold border"
              style={{
                background: activeTab === tab.key ? "var(--color-portal-primary)" : "var(--color-surface)",
                color: activeTab === tab.key ? "#fff" : "var(--color-text-secondary)",
                borderColor: activeTab === tab.key ? "var(--color-portal-primary)" : "var(--color-border)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card padded={false}>
          <CardBody>
            {isLoading ? (
              <PageLoader />
            ) : filtered.length === 0 ? (
              <EmptyState icon="folder" title="No documents yet" description="Upload the first document for this stage." />
            ) : (
              filtered.map((doc) => (
                <div key={doc.id} className="flex items-center">
                  <div className="flex-1">
                    <DocumentRow doc={doc} />
                  </div>
                  <span
                    className="badge ml-2 flex-shrink-0"
                    style={{
                      background: doc.isClientVisible ? "var(--color-success-bg)" : "var(--color-bg)",
                      color: doc.isClientVisible ? "var(--color-success)" : "var(--color-text-tertiary)",
                    }}
                  >
                    {doc.isClientVisible ? "Client visible" : "Internal only"}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload documents"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={isUploading || pendingFiles.length === 0}>
              {isUploading ? "Uploading…" : `Upload ${pendingFiles.length || ""}`}
            </Button>
          </>
        }
      >
        <FileUpload multiple onFilesSelected={setPendingFiles} />
        <label className="flex items-center gap-2 mt-4 text-sm text-(--color-text-primary)">
          <input
            type="checkbox"
            checked={isClientVisible}
            onChange={(e) => setIsClientVisible(e.target.checked)}
            className="rounded"
          />
          Make visible to client
        </label>
      </Modal>
    </>
  );
}
