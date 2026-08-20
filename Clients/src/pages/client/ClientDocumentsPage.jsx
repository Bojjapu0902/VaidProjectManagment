import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardBody } from "../../components/common/Card";
import { DocumentRow } from "../../components/client/ClientWidgets";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import { useGetDocumentsByProjectQuery } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

const CATEGORY_TABS = [
  { key: "all", label: "All" },
  { key: "drawing", label: "Drawings & plans" },
  { key: "report", label: "Reports" },
  { key: "contract", label: "Contracts" },
  { key: "photo", label: "Photos" },
];

// DWG/RVT files can't preview in-browser (see DocumentRow) — download still
// works for every file type, so the action itself never needs to be blocked.
const PREVIEWABLE_TYPES = new Set(["pdf", "jpg", "jpeg", "png"]);

export default function ClientDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // The server only ever returns documents the team has explicitly marked
  // client-visible (clientVisibleOnly: true) — everything rendered below is
  // already safe to show, so this page does no extra visibility filtering.
  const { data: documents = [], isLoading } = useGetDocumentsByProjectQuery(
    { projectId: id, clientVisibleOnly: true },
    { skip: !id }
  );
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all" ? documents : documents.filter((d) => d.category === activeTab);

  const categoryCounts = useMemo(() => {
    const counts = { all: documents.length };
    documents.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Grouped by stage so the list reads as a project history rather than a
  // folder dump — most recent stage first, newest file in each group first.
  const groupedByStage = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => {
      if (!map.has(d.stageNumber)) map.set(d.stageNumber, []);
      map.get(d.stageNumber).push(d);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([stageNumber, docs]) => {
        const sorted = [...docs].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return { stageNumber, stage: getStageByNumber(stageNumber), docs: sorted, latestDate: sorted[0]?.createdAt };
      });
  }, [filtered]);

  const handleView = (doc) => {
    const fileType = doc.fileType?.toLowerCase();
    if (!PREVIEWABLE_TYPES.has(fileType)) {
      dispatch(pushToast(`${doc.fileType?.toUpperCase()} files download instead of preview`, "warning"));
      return;
    }
    dispatch(pushToast(`Opening "${doc.name}"…`, "success"));
  };

  const handleDownload = (doc) => {
    dispatch(pushToast(`Downloading "${doc.name}"…`, "success"));
  };

  const handleDownloadAll = () => {
    dispatch(
      pushToast(
        `Building a zip of all ${documents.length} shared file${documents.length === 1 ? "" : "s"} — you'll get a notification when it's ready.`,
        "success"
      )
    );
  };

  return (
    <>
      <Topbar
        title="Document centre"
        subtitle={`${documents.length} file${documents.length === 1 ? "" : "s"} shared with you, grouped by stage`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        actions={
          <Button variant="secondary" icon={<Icon name="download" size={15} />} onClick={handleDownloadAll} disabled={documents.length === 0}>
            Download everything
          </Button>
        }
      />
      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <div className="flex gap-2 mb-5 flex-wrap">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className="px-4 py-2 rounded-(--radius-pill) text-xs font-semibold border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
              style={{
                background: activeTab === tab.key ? "var(--color-portal-primary)" : "var(--color-surface)",
                color: activeTab === tab.key ? "#fff" : "var(--color-text-secondary)",
                borderColor: activeTab === tab.key ? "var(--color-portal-primary)" : "var(--color-border)",
              }}
            >
              {tab.label} {categoryCounts[tab.key] || 0}
            </button>
          ))}
        </div>

        <Card padded={false}>
          <CardBody>
            {isLoading ? (
              <PageLoader />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="folders"
                title="No documents in this category"
                description="Try a different category, or check back once the team shares more files."
              />
            ) : (
              <div className="flex flex-col gap-6">
                {groupedByStage.map(({ stageNumber, stage, docs, latestDate }, idx) => (
                  <div key={stageNumber} className={idx > 0 ? "flex flex-col gap-1 pt-5 border-t border-(--color-border)" : "flex flex-col gap-1"}>
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: stage.color }} />
                      <span className="text-sm font-semibold text-(--color-text-primary)">
                        Stage {stageNumber} · {stage.shortName}
                      </span>
                      <span className="text-[11px] font-mono text-(--color-text-secondary)">
                        {docs.length} file{docs.length === 1 ? "" : "s"}
                        {latestDate ? ` · shared ${latestDate}` : ""}
                      </span>
                    </div>
                    <div>
                      {docs.map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} onView={handleView} onDownload={handleDownload} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
