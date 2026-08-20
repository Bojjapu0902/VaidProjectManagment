import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Table from "../../components/common/Table";
import FileUpload from "../../components/common/FileUpload";
import { EmptyState, PageLoader } from "../../components/common/EmptyState";
import {
  useGetDocumentsByProjectQuery,
  useUploadDocumentMutation,
  useGetProjectByIdQuery,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { STAGES, getStageByNumber, getProjectLifecycleStages } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

const CATEGORY_OPTIONS = [
  { value: "drawing", label: "Drawings & plans" },
  { value: "report", label: "Reports" },
  { value: "contract", label: "Contracts" },
  { value: "photo", label: "Photos" },
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]));
const CATEGORY_ICON = { drawing: "blueprint", report: "file-text", contract: "file-text", photo: "photo" };

function parseSizeToBytes(sizeStr) {
  const match = String(sizeStr || "").trim().match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || "MB").toUpperCase();
  const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit] || 1;
  return value * mult;
}

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

const groupKey = (doc) => `${doc.stageNumber}::${doc.name.trim().toLowerCase()}`;

function VisibilityPill({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={visible}
      title={visible ? "Client can see this file — click to make internal only" : "Internal only — click to make visible to the client"}
      className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-(--radius-pill) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
      style={{
        background: visible ? "var(--color-success-bg)" : "var(--color-warning-bg)",
        color: visible ? "var(--color-success)" : "var(--color-warning)",
      }}
    >
      <Icon name={visible ? "eye" : "lock"} size={11} />
      {visible ? "CLIENT" : "INTERNAL"}
    </button>
  );
}

export default function DocumentManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project } = useGetProjectByIdQuery(id);
  const { data: documents = [], isLoading } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();

  const [stageFilter, setStageFilter] = useState(null); // null = all stages
  const [categoryFilter, setCategoryFilter] = useState(null); // null = all categories
  const [visibilityFilter, setVisibilityFilter] = useState(null); // null | "client" | "internal"
  const [visibilityOverrides, setVisibilityOverrides] = useState({});
  const [historyKey, setHistoryKey] = useState(null);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState("drawing");
  const [uploadStageNumber, setUploadStageNumber] = useState(null);
  const [isClientVisible, setIsClientVisible] = useState(false); // documents default to internal — a deliberate act makes them visible

  const lifecycleStages = project ? getProjectLifecycleStages(project) : STAGES;

  const effectiveVisible = (doc) => visibilityOverrides[doc.id] ?? doc.isClientVisible;

  const toggleVisibility = (doc) => {
    const next = !effectiveVisible(doc);
    setVisibilityOverrides((prev) => ({ ...prev, [doc.id]: next }));
    dispatch(
      pushToast(
        next ? `"${doc.name}" is now visible to the client — it will show on their timeline` : `"${doc.name}" set to internal only`,
        "success"
      )
    );
  };

  const stageCounts = useMemo(() => {
    const map = {};
    documents.forEach((d) => {
      map[d.stageNumber] = (map[d.stageNumber] || 0) + 1;
    });
    return map;
  }, [documents]);

  const stagesWithDocs = useMemo(
    () => Object.keys(stageCounts).map(Number).sort((a, b) => b - a),
    [stageCounts]
  );

  const totalBytes = useMemo(() => documents.reduce((sum, d) => sum + parseSizeToBytes(d.fileSize), 0), [documents]);
  const distinctStageCount = stagesWithDocs.length;

  const filtered = useMemo(
    () =>
      documents.filter((d) => {
        if (stageFilter && d.stageNumber !== stageFilter) return false;
        if (categoryFilter && d.category !== categoryFilter) return false;
        if (visibilityFilter === "client" && !effectiveVisible(d)) return false;
        if (visibilityFilter === "internal" && effectiveVisible(d)) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, stageFilter, categoryFilter, visibilityFilter, visibilityOverrides]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => {
      const key = groupKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    return Array.from(map.entries()).map(([key, group]) => {
      const versions = [...group].sort((a, b) => (b.version || 1) - (a.version || 1));
      return { id: versions[0].id, key, rep: versions[0], versions, earlierCount: versions.length - 1 };
    });
  }, [filtered]);

  const historyGroup = grouped.find((g) => g.key === historyKey) || grouped.find((g) => g.earlierCount > 0) || grouped[0];

  const effectiveUploadStage = uploadStageNumber ?? stageFilter ?? project?.currentStage ?? lifecycleStages[0]?.number ?? 1;

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    try {
      await Promise.all(
        pendingFiles.map((file) => {
          const priorVersion = documents.find((d) => d.stageNumber === effectiveUploadStage && d.name === file.name);
          return uploadDocument({
            projectId: id,
            payload: {
              name: file.name,
              stageNumber: effectiveUploadStage,
              category: uploadCategory,
              fileType: file.name.split(".").pop(),
              fileSize: formatBytes(file.size),
              version: priorVersion ? (priorVersion.version || 1) + 1 : 1,
              isClientVisible,
              uploadedBy: "You",
              createdAt: new Date().toISOString().slice(0, 10),
            },
          }).unwrap();
        })
      );
      dispatch(
        pushToast(
          `${pendingFiles.length} document${pendingFiles.length > 1 ? "s" : ""} uploaded to Stage ${effectiveUploadStage}${isClientVisible ? "" : " — internal only"}`,
          "success"
        )
      );
      setPendingFiles([]);
    } catch (err) {
      dispatch(pushToast(err.message || "Upload failed", "danger"));
    }
  };

  const handleDownloadPackage = () => {
    const scopeLabel = stageFilter ? `Stage ${stageFilter}` : "all stages";
    dispatch(pushToast(`Preparing a package for ${scopeLabel} (${filtered.length} file${filtered.length === 1 ? "" : "s"}) — you'll be notified when it's ready.`, "success"));
  };

  const clearFilters = () => {
    setStageFilter(null);
    setCategoryFilter(null);
    setVisibilityFilter(null);
  };

  const columns = [
    {
      key: "file",
      header: "File",
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[30px] h-[30px] rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
            <Icon name={CATEGORY_ICON[row.rep.category] || "file-text"} size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">{row.rep.name}</div>
            <div className="text-[10.5px] font-mono text-(--color-text-secondary)">
              {row.rep.fileSize}
              {row.earlierCount > 0 && ` · ${row.earlierCount} earlier version${row.earlierCount > 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => <span className="text-xs text-(--color-text-secondary)">{CATEGORY_LABEL[row.rep.category] || row.rep.category}</span>,
    },
    {
      key: "version",
      header: "Ver.",
      render: (row) => (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-(--radius-pill) bg-(--color-bg) text-(--color-text-primary)">
          v{row.rep.version || 1}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => <VisibilityPill visible={effectiveVisible(row.rep)} onToggle={() => toggleVisibility(row.rep)} />,
    },
    {
      key: "uploadedBy",
      header: "Uploaded by",
      render: (row) => <span className="text-xs text-(--color-text-primary)">{row.rep.uploadedBy}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => <span className="text-[11.5px] font-mono text-(--color-text-secondary)">{row.rep.createdAt}</span>,
    },
  ];

  return (
    <>
      <Topbar
        title="Document management"
        subtitle={project ? project.title : undefined}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Icon name="download" size={14} />} onClick={handleDownloadPackage}>
              Download stage package
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-(--color-border)">
            <div>
              <p className="text-[17px] font-bold text-(--color-text-primary)">Documents</p>
              <p className="text-[12.5px] text-(--color-text-secondary)">
                {documents.length} file{documents.length === 1 ? "" : "s"} across {distinctStageCount} stage{distinctStageCount === 1 ? "" : "s"} · {formatBytes(totalBytes)}
              </p>
            </div>
            {(stageFilter || categoryFilter || visibilityFilter) && (
              <button onClick={clearFilters} className="text-xs font-semibold text-(--color-portal-primary) flex items-center gap-1 w-fit">
                <Icon name="x" size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr]">
            {/* ---------------- Sidebar filters ---------------- */}
            <div className="border-b lg:border-b-0 lg:border-r border-(--color-border) p-4.5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-wide text-(--color-text-secondary)">BY STAGE</span>
                <button
                  onClick={() => setStageFilter(null)}
                  aria-pressed={stageFilter === null}
                  className="text-[12.5px] px-2.5 py-1.5 rounded-(--radius-sm) flex justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                  style={{
                    background: stageFilter === null ? "var(--color-portal-primary)" : "transparent",
                    color: stageFilter === null ? "#fff" : "var(--color-text-primary)",
                    fontWeight: stageFilter === null ? 700 : 400,
                  }}
                >
                  <span>All stages</span>
                  <span className="font-mono">{documents.length}</span>
                </button>
                {stagesWithDocs.map((num) => {
                  const stage = getStageByNumber(num);
                  const active = stageFilter === num;
                  return (
                    <button
                      key={num}
                      onClick={() => setStageFilter(active ? null : num)}
                      aria-pressed={active}
                      className="text-[12.5px] px-2.5 py-1.5 rounded-(--radius-sm) flex justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                      style={{
                        background: active ? "var(--color-portal-primary)" : "transparent",
                        color: active ? "#fff" : "var(--color-text-primary)",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      <span className="truncate">
                        Stage {num} · {stage.shortName}
                      </span>
                      <span className="font-mono flex-shrink-0" style={{ color: active ? "#fff" : "var(--color-text-secondary)" }}>
                        {stageCounts[num]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1 pt-3.5 border-t border-(--color-border)">
                <span className="text-[11px] font-semibold tracking-wide text-(--color-text-secondary)">CATEGORY</span>
                {CATEGORY_OPTIONS.map((c) => {
                  const active = categoryFilter === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setCategoryFilter(active ? null : c.value)}
                      aria-pressed={active}
                      className="text-[12.5px] px-2.5 py-1.5 rounded-(--radius-sm) text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                      style={{
                        background: active ? "var(--color-bg)" : "transparent",
                        color: active ? "var(--color-portal-primary)" : "var(--color-text-primary)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 pt-3.5 border-t border-(--color-border)">
                <span className="text-[11px] font-semibold tracking-wide text-(--color-text-secondary)">VISIBILITY</span>
                <button
                  onClick={() => setVisibilityFilter(visibilityFilter === "client" ? null : "client")}
                  aria-pressed={visibilityFilter === "client"}
                  className="flex items-center gap-2 text-[12.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
                  style={{ fontWeight: visibilityFilter === "client" ? 700 : 400, color: "var(--color-text-primary)" }}
                >
                  <Icon name="eye" size={13} className="text-(--color-success) flex-shrink-0" />
                  Client visible
                </button>
                <button
                  onClick={() => setVisibilityFilter(visibilityFilter === "internal" ? null : "internal")}
                  aria-pressed={visibilityFilter === "internal"}
                  className="flex items-center gap-2 text-[12.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
                  style={{ fontWeight: visibilityFilter === "internal" ? 700 : 400, color: "var(--color-text-primary)" }}
                >
                  <Icon name="lock" size={13} className="text-(--color-warning) flex-shrink-0" />
                  Internal only
                </button>
              </div>
            </div>

            {/* ---------------- Main panel ---------------- */}
            <div className="flex flex-col min-w-0">
              <div className="m-4 sm:m-5 border-2 border-dashed border-(--color-border) rounded-(--radius-md) bg-(--color-bg) p-5 flex flex-col gap-3">
                <FileUpload multiple onFilesSelected={setPendingFiles} accept=".pdf,.dwg,.jpg,.jpeg,.png,.xlsx,.docx" />
                <p className="text-[11.5px] text-(--color-text-secondary)">PDF, DWG, JPG, PNG, XLSX, DOCX · max 50 MB each</p>

                {pendingFiles.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-3 border-t border-(--color-border)">
                    <div className="flex-1 min-w-0">
                      <label htmlFor="upload-category" className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
                        Category
                      </label>
                      <select
                        id="upload-category"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="input-field"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label htmlFor="upload-stage" className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
                        Stage
                      </label>
                      <select
                        id="upload-stage"
                        value={effectiveUploadStage}
                        onChange={(e) => setUploadStageNumber(Number(e.target.value))}
                        className="input-field"
                      >
                        {lifecycleStages.map((s) => (
                          <option key={s.number} value={s.number}>
                            Stage {s.number} · {s.shortName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-(--color-text-primary) select-none whitespace-nowrap pb-2.5">
                      <input
                        type="checkbox"
                        checked={isClientVisible}
                        onChange={(e) => setIsClientVisible(e.target.checked)}
                        className="rounded"
                      />
                      Make visible to client
                    </label>
                    <Button variant="primary" onClick={handleUpload} disabled={isUploading} className="flex-shrink-0">
                      {isUploading ? "Uploading…" : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <PageLoader />
              ) : grouped.length === 0 ? (
                <EmptyState
                  icon="folder"
                  title="No documents match these filters"
                  description="Try clearing a filter, or upload the first document for this stage above."
                  action={
                    (stageFilter || categoryFilter || visibilityFilter) && (
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <Table columns={columns} data={grouped} onRowClick={(row) => setHistoryKey(row.key)} />
                  {historyGroup && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center px-5 py-3.5 border-t border-(--color-border) bg-(--color-bg)">
                      <span className="text-[10px] font-mono font-semibold tracking-wide text-(--color-text-secondary) flex-shrink-0">
                        VERSION HISTORY · {historyGroup.rep.name}
                      </span>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                        {historyGroup.versions.map((v, i) => (
                          <span key={v.id}>
                            <span className={`font-mono font-semibold ${i === 0 ? "text-(--color-text-primary)" : "text-(--color-text-secondary)"}`}>
                              v{v.version || 1}
                            </span>{" "}
                            <span className={i === 0 ? "text-(--color-text-secondary)" : "text-(--color-text-tertiary)"}>
                              {i === 0 ? `${v.createdAt} · current` : "superseded"}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
