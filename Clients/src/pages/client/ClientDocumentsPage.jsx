import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardBody } from "../../components/common/Card";
import { DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import { useGetDocumentsByProjectQuery } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

const CATEGORY_TABS = [
  { key: "all", label: "All" },
  { key: "drawing", label: "Drawings & plans" },
  { key: "report", label: "Reports" },
  { key: "photo", label: "Photos" },
];

export default function ClientDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: documents = [], isLoading } = useGetDocumentsByProjectQuery(
    { projectId: id, clientVisibleOnly: true },
    { skip: !id }
  );
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all" ? documents : documents.filter((d) => d.category === activeTab);

  return (
    <>
      <Topbar
        title="Document centre"
        subtitle={`${documents.length} documents available`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        actions={
          <Button variant="secondary" icon={<Icon name="download" size={15} />}>
            Download all
          </Button>
        }
      />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
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
              <EmptyState icon="folders" title="No documents in this category" />
            ) : (
              filtered.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
