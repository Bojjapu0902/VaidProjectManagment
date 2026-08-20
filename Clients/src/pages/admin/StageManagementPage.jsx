import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { Badge } from "../../components/common/Badge";
import { Input, Textarea } from "../../components/common/FormField";
import ProgressBar from "../../components/common/ProgressBar";
import { PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery,
  useUpdateStageMutation,
  useGetDocumentsByProjectQuery,
  useGetApprovalsQuery,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { STAGES, getStageByNumber, getProjectLifecycleStages } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

const COLOR_PALETTE = STAGES.map((s) => s.color);

const emptyMilestone = (label = "New milestone") => ({
  id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: label,
  ownerId: "",
  dueDate: "",
  isComplete: false,
});

// Seeds this project's own editable lifecycle from its lifecycle definition
// (falling back to the standard 8-stage template) — a project's stages are
// never assumed to be a fixed count of 8.
function buildInitialStages(project) {
  const lifecycle = getProjectLifecycleStages(project);
  const start = new Date(project?.timeline?.startDate || Date.now());
  const end = new Date(project?.timeline?.expectedEndDate || Date.now());
  const totalMs = Math.max(end.getTime() - start.getTime(), lifecycle.length * 86400000);
  const perStageMs = totalMs / lifecycle.length;

  return lifecycle.map((src, idx) => {
    const base = getStageByNumber(src.number) || {};
    const isKnownTemplateStage = STAGES.some((s) => s.number === src.number && s.shortName === src.shortName);
    const stageStart = new Date(start.getTime() + idx * perStageMs);
    const stageTarget = new Date(start.getTime() + (idx + 1) * perStageMs);
    return {
      number: src.number,
      name: src.shortName || base.name || `Stage ${src.number}`,
      color: src.color || base.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
      description: base.statusLabel || "",
      startDate: stageStart.toISOString().slice(0, 10),
      targetDate: stageTarget.toISOString().slice(0, 10),
      completedAt: null,
      clientGate: src.number <= 6,
      visibleToClient: true,
      deriveProgress: true,
      manualPercent: src.number < (project?.currentStage || 1) ? 100 : 0,
      isCustom: !isKnownTemplateStage,
      milestones: (base.items || []).map((title, i) => ({
        id: `${src.number}-m${i}`,
        title,
        ownerId: "",
        dueDate: "",
        isComplete: src.number < (project?.currentStage || 1),
      })),
    };
  });
}

function getRemoveBlockReason(stage, docCount, hasApproval, totalStages) {
  if (totalStages <= 1) return "Cannot remove — a project needs at least one stage";
  if (docCount > 0 && hasApproval) {
    return `Cannot remove — holds ${docCount} document${docCount > 1 ? "s" : ""} and a recorded approval`;
  }
  if (docCount > 0) return `Cannot remove — holds ${docCount} document${docCount > 1 ? "s" : ""}`;
  if (hasApproval) return "Cannot remove — has a recorded client approval";
  return null;
}

function ToggleSwitch({ id, checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-(--color-text-primary) block cursor-pointer">
          {label}
        </label>
        {hint && <p className="text-[11px] text-(--color-text-secondary) mt-0.5">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
        style={{ background: checked ? "var(--color-green)" : "var(--color-border-strong)" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function StageManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: documents = [] } = useGetDocumentsByProjectQuery({ projectId: id }, { skip: !id });
  const { data: approvals = [] } = useGetApprovalsQuery({ projectId: id }, { skip: !id });
  const [updateStage, { isLoading: isSaving }] = useUpdateStageMutation();

  const [stages, setStages] = useState(null);
  const [savedStages, setSavedStages] = useState(null);
  const [currentActiveNumber, setCurrentActiveNumber] = useState(null);
  const [selectedStageNumber, setSelectedStageNumber] = useState(null);
  const [isRailEditing, setIsRailEditing] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [seededProjectId, setSeededProjectId] = useState(null);

  // Seed local editable stage state whenever a (new) project loads.
  if (project && seededProjectId !== project.id) {
    setSeededProjectId(project.id);
    const initial = buildInitialStages(project);
    setStages(initial);
    setSavedStages(initial);
    setCurrentActiveNumber(project.currentStage || 1);
    setSelectedStageNumber(project.currentStage || 1);
  }

  const docCounts = useMemo(() => {
    const map = {};
    documents.forEach((d) => {
      map[d.stageNumber] = (map[d.stageNumber] || 0) + 1;
    });
    return map;
  }, [documents]);

  const approvedStageNumbers = useMemo(
    () => new Set(approvals.filter((a) => a.status === "approved").map((a) => a.stageNumber)),
    [approvals]
  );

  if (isLoading || !project || stages === null) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const selectedStage = stages.find((s) => s.number === selectedStageNumber) || stages[0];
  const selectedIndex = stages.findIndex((s) => s.number === selectedStage.number);
  const isActiveStage = selectedStage.number === currentActiveNumber;
  const isLockedStage = selectedStage.number > currentActiveNumber;
  const isCompletedStage = selectedStage.number < currentActiveNumber;
  const teamOptions = [{ value: "", label: "Unassigned" }, ...(project.team || []).map((t) => ({ value: t.userId, label: t.name }))];

  const completedMilestones = selectedStage.milestones.filter((m) => m.isComplete).length;
  const totalMilestones = selectedStage.milestones.length;
  const derivedPercent = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const displayPercent = selectedStage.deriveProgress ? derivedPercent : selectedStage.manualPercent;

  const openMilestoneCount = selectedStage.milestones.filter((m) => !m.isComplete).length;
  const gateSatisfied = !selectedStage.clientGate || approvedStageNumbers.has(selectedStage.number);
  const outstanding = [];
  if (openMilestoneCount > 0) outstanding.push(`${openMilestoneCount} milestone${openMilestoneCount > 1 ? "s" : ""} open`);
  if (!gateSatisfied) outstanding.push("client approval not yet recorded");
  const canAdvance = outstanding.length === 0;
  const nextNumber = currentActiveNumber + 1;
  const laterStagesCount = stages.filter((s) => s.number > selectedStage.number).length;

  const docCount = docCounts[selectedStage.number] || 0;
  const hasApproval = approvedStageNumbers.has(selectedStage.number);
  const removeReason = getRemoveBlockReason(selectedStage, docCount, hasApproval, stages.length);

  const updateStageField = (number, field, value) => {
    setStages((prev) => prev.map((s) => (s.number === number ? { ...s, [field]: value } : s)));
  };

  const updateMilestone = (stageNumber, milestoneId, patch) => {
    setStages((prev) =>
      prev.map((s) =>
        s.number !== stageNumber
          ? s
          : { ...s, milestones: s.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m)) }
      )
    );
  };

  const addMilestone = (stageNumber) => {
    setStages((prev) =>
      prev.map((s) => (s.number !== stageNumber ? s : { ...s, milestones: [...s.milestones, emptyMilestone()] }))
    );
  };

  const removeMilestone = (stageNumber, milestoneId) => {
    setStages((prev) =>
      prev.map((s) =>
        s.number !== stageNumber ? s : { ...s, milestones: s.milestones.filter((m) => m.id !== milestoneId) }
      )
    );
  };

  const moveMilestone = (stageNumber, idx, dir) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.number !== stageNumber) return s;
        const arr = [...s.milestones];
        const swap = idx + dir;
        if (swap < 0 || swap >= arr.length) return s;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        return { ...s, milestones: arr };
      })
    );
  };

  const remapAround = (nextStages, insertedOrRemovedAt, delta) => {
    setCurrentActiveNumber((n) => (insertedOrRemovedAt <= n ? Math.max(1, Math.min(nextStages.length, n + delta)) : n));
  };

  const handleAddStage = () => {
    const idx = stages.findIndex((s) => s.number === selectedStageNumber);
    const insertAt = idx === -1 ? stages.length : idx + 1;
    const newStage = {
      number: 0,
      name: "New stage",
      color: COLOR_PALETTE[insertAt % COLOR_PALETTE.length],
      description: "",
      startDate: "",
      targetDate: "",
      completedAt: null,
      clientGate: false,
      visibleToClient: true,
      deriveProgress: true,
      manualPercent: 0,
      isCustom: true,
      milestones: [],
    };
    const next = [...stages.slice(0, insertAt), newStage, ...stages.slice(insertAt)].map((s, i) => ({
      ...s,
      number: i + 1,
    }));
    setStages(next);
    setSavedStages(next);
    setSelectedStageNumber(insertAt + 1);
    remapAround(next, insertAt + 1, 1);
    dispatch(pushToast("Stage added — later stages renumbered", "success"));
  };

  const handleDuplicateStage = () => {
    const clone = {
      ...selectedStage,
      name: `${selectedStage.name} copy`,
      isCustom: true,
      completedAt: null,
      milestones: selectedStage.milestones.map((m, i) => ({
        ...m,
        id: `${Date.now()}-${i}`,
        isComplete: false,
      })),
    };
    const insertAt = selectedIndex + 1;
    const next = [...stages.slice(0, insertAt), clone, ...stages.slice(insertAt)].map((s, i) => ({
      ...s,
      number: i + 1,
    }));
    setStages(next);
    setSavedStages(next);
    setSelectedStageNumber(insertAt + 1);
    remapAround(next, insertAt + 1, 1);
    dispatch(pushToast("Stage duplicated", "success"));
  };

  const handleRemoveStage = () => {
    if (removeReason) return;
    const next = stages.filter((s) => s.number !== selectedStage.number).map((s, i) => ({ ...s, number: i + 1 }));
    setStages(next);
    setSavedStages(next);
    setSelectedStageNumber(Math.max(1, Math.min(selectedStage.number, next.length)));
    remapAround(next, selectedStage.number, -1);
    dispatch(pushToast("Stage removed — later stages renumbered", "success"));
  };

  // Takes an explicit stage number (rather than reading selectedStage from
  // the render closure) so it stays correct when triggered from a rail row
  // that isn't the currently-selected one.
  const moveStageByNumber = (number, dir) => {
    const idx = stages.findIndex((s) => s.number === number);
    if (idx === -1) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= stages.length) return;
    const arr = [...stages];
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const renumbered = arr.map((s, i) => ({ ...s, number: i + 1 }));
    setStages(renumbered);
    setSavedStages(renumbered);
    if (currentActiveNumber - 1 === idx) setCurrentActiveNumber(swap + 1);
    else if (currentActiveNumber - 1 === swap) setCurrentActiveNumber(idx + 1);
    setSelectedStageNumber(swap + 1);
    dispatch(pushToast("Stage order updated", "success"));
  };

  const handleCancelEdits = () => {
    setStages((prev) => prev.map((s) => (s.number === selectedStage.number ? savedStages.find((x) => x.number === s.number) || s : s)));
  };

  const handleSaveStage = async () => {
    try {
      await updateStage({
        projectId: id,
        stageNumber: selectedStage.number,
        payload: {
          name: selectedStage.name,
          color: selectedStage.color,
          description: selectedStage.description,
          startDate: selectedStage.startDate,
          targetDate: selectedStage.targetDate,
          clientGate: selectedStage.clientGate,
          visibleToClient: selectedStage.visibleToClient,
          deriveProgress: selectedStage.deriveProgress,
          milestones: selectedStage.milestones,
        },
      }).unwrap();
      setSavedStages(stages);
      dispatch(
        pushToast(
          `Stage ${selectedStage.number} updated${selectedStage.visibleToClient ? " — client will see the new details" : ""}`,
          "success"
        )
      );
    } catch (err) {
      dispatch(pushToast(err.message || "Could not save stage", "danger"));
    }
  };

  const handleAdvance = async () => {
    if (!canAdvance) return;
    try {
      await updateStage({
        projectId: id,
        stageNumber: currentActiveNumber,
        payload: { status: "completed", clientGate: selectedStage.clientGate },
      }).unwrap();
      setStages((prev) =>
        prev.map((s) => (s.number === currentActiveNumber ? { ...s, completedAt: new Date().toISOString().slice(0, 10), manualPercent: 100 } : s))
      );
      if (nextNumber <= stages.length) {
        setCurrentActiveNumber(nextNumber);
        setSelectedStageNumber(nextNumber);
        dispatch(pushToast(`Stage ${currentActiveNumber} complete — advanced to stage ${nextNumber}`, "success"));
      } else {
        dispatch(pushToast("Final stage complete — project ready for closeout", "success"));
      }
    } catch (err) {
      dispatch(pushToast(err.message || "Could not advance stage", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Stage management" subtitle={project.title} notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />

      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false}>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
            {/* ---------------- Stage rail ---------------- */}
            <div className="border-b lg:border-b-0 lg:border-r border-(--color-border) flex flex-col">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-(--color-border)">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-(--color-text-primary)">Stages</p>
                  <p className="text-[10px] font-mono tracking-wide text-(--color-text-secondary)">
                    {stages.length} · {stages.some((s) => s.isCustom) ? "CUSTOM LIFECYCLE" : "STANDARD LIFECYCLE"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRailEditing((v) => !v)}
                  aria-pressed={isRailEditing}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-(--radius-sm) border flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                  style={{
                    borderColor: "var(--color-portal-primary)",
                    color: "var(--color-portal-primary)",
                    background: isRailEditing ? "var(--color-portal-primary-light)" : "var(--color-surface)",
                  }}
                >
                  <Icon name="edit" size={13} /> Edit stages
                </button>
              </div>

              <div className="flex flex-col flex-1 max-h-[560px] overflow-y-auto">
                {stages.map((stage, idx) => {
                  const isDone = stage.number < currentActiveNumber;
                  const isCurrent = stage.number === currentActiveNumber;
                  const isSelected = stage.number === selectedStage.number;
                  const stageDocCount = docCounts[stage.number] || 0;
                  return (
                    <div
                      key={stage.number}
                      className="border-b border-(--color-border) last:border-b-0"
                      style={{
                        borderLeft: `3px solid ${isCurrent ? stage.color : isDone ? "var(--color-success)" : "var(--color-border)"}`,
                        background: isSelected ? "var(--color-bg)" : isCurrent ? "color-mix(in srgb, var(--color-info) 6%, transparent)" : "transparent",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedStageNumber(stage.number)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-portal-primary)"
                      >
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[13px] truncate ${isCurrent ? "font-semibold text-(--color-text-primary)" : isDone ? "text-(--color-text-primary)" : "text-(--color-text-tertiary)"}`}
                            >
                              {stage.number} · {stage.name}
                            </span>
                            {stage.isCustom && <Badge variant="warning">Custom</Badge>}
                          </div>
                          <span
                            className="text-[10px] font-mono tracking-wide"
                            style={{ color: isCurrent ? stage.color : isDone ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" }}
                          >
                            {isDone
                              ? stage.completedAt
                                ? `COMPLETED ${stage.completedAt}`
                                : "COMPLETED"
                              : isCurrent
                                ? `ACTIVE · ${displayPercent}%`
                                : `LOCKED${!stage.clientGate ? " · NO CLIENT GATE" : ""}`}
                            {stageDocCount > 0 && ` · ${stageDocCount} FILE${stageDocCount > 1 ? "S" : ""}`}
                          </span>
                        </div>
                        {isDone && (
                          <span className="w-[18px] h-[18px] rounded-full bg-(--color-success) text-white flex items-center justify-center flex-shrink-0">
                            <Icon name="check" size={11} />
                          </span>
                        )}
                      </button>
                      {isRailEditing && (
                        <div className="flex items-center gap-1 px-4 pb-2.5 -mt-1">
                          <button
                            type="button"
                            onClick={() => moveStageByNumber(stage.number, -1)}
                            disabled={idx === 0}
                            aria-label={`Move ${stage.name} up`}
                            className="icon-btn w-7 h-7"
                          >
                            <Icon name="chevron-down" size={13} className="rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStageByNumber(stage.number, 1)}
                            disabled={idx === stages.length - 1}
                            aria-label={`Move ${stage.name} down`}
                            className="icon-btn w-7 h-7"
                          >
                            <Icon name="chevron-down" size={13} />
                          </button>
                          <span className="text-[10.5px] text-(--color-text-tertiary) ml-1">Reorder</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto px-5 py-3 border-t border-(--color-border) bg-(--color-bg) flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="text-[12.5px] font-semibold flex items-center gap-1 text-(--color-portal-primary) w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary) rounded-(--radius-sm)"
                >
                  <Icon name="plus" size={13} /> Add a stage
                </button>
                <span className="text-[11px] text-(--color-text-secondary)">Inserts after the stage selected here</span>
              </div>
            </div>

            {/* ---------------- Stage editor ---------------- */}
            <div className="flex flex-col min-w-0">
              <div className="px-5 py-4 border-b border-(--color-border) flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-(--color-text-secondary)">
                      STAGE {selectedStage.number} OF {stages.length}
                    </span>
                    {selectedStage.description && <Badge variant="info">{selectedStage.description}</Badge>}
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-(--radius-pill)"
                      style={{
                        background: selectedStage.clientGate ? "var(--color-success-bg)" : "var(--color-bg)",
                        color: selectedStage.clientGate ? "var(--color-success)" : "var(--color-text-tertiary)",
                      }}
                    >
                      <Icon name="lock" size={10} /> CLIENT GATE {selectedStage.clientGate ? "ON" : "OFF"}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      aria-label="Stage name"
                      value={selectedStage.name}
                      onChange={(e) => updateStageField(selectedStage.number, "name", e.target.value)}
                      className="text-[15px] font-semibold"
                      containerClassName="flex-1 min-w-0"
                    />
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setColorPickerOpen((v) => !v)}
                        aria-label="Change stage colour"
                        aria-expanded={colorPickerOpen}
                        className="w-[38px] h-[38px] rounded-(--radius-sm) border border-(--color-border) flex items-center justify-center bg-(--color-surface) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                      >
                        <span className="w-4 h-4 rounded-full" style={{ background: selectedStage.color }} />
                      </button>
                      {colorPickerOpen && (
                        <div className="absolute z-10 top-full mt-1 right-0 bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) shadow-(--shadow-md) p-2 grid grid-cols-4 gap-2">
                          {STAGES.map((s) => (
                            <button
                              key={s.colorToken}
                              type="button"
                              onClick={() => {
                                updateStageField(selectedStage.number, "color", s.color);
                                setColorPickerOpen(false);
                              }}
                              aria-label={`Use ${s.colorToken} colour`}
                              className="w-6 h-6 rounded-full border border-(--color-border)"
                              style={{
                                background: s.color,
                                boxShadow: selectedStage.color === s.color ? "0 0 0 2px var(--color-text-primary)" : "none",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Textarea
                    aria-label="Stage description"
                    rows={1}
                    value={selectedStage.description}
                    onChange={(e) => updateStageField(selectedStage.number, "description", e.target.value)}
                    className="text-[12.5px]"
                  />
                  <span className="text-[11.5px] text-(--color-text-secondary)">
                    Name, colour and description are editable in place. The client sees this name on their timeline.
                  </span>
                </div>

                <div className="flex flex-col gap-2 items-stretch lg:items-end flex-shrink-0">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCancelEdits}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveStage} disabled={isSaving}>
                      {isSaving ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleDuplicateStage} className="border border-(--color-border)">
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveStage}
                      disabled={!!removeReason}
                      className="border border-(--color-border)"
                    >
                      Remove stage
                    </Button>
                  </div>
                  {removeReason && (
                    <span className="text-[11px] text-(--color-text-tertiary) text-right max-w-[210px] leading-snug">
                      {removeReason}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="stage-start" className="text-xs text-(--color-text-secondary)">
                      Start date
                    </label>
                    <Input
                      id="stage-start"
                      type="date"
                      value={selectedStage.startDate}
                      onChange={(e) => updateStageField(selectedStage.number, "startDate", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="stage-target" className="text-xs text-(--color-text-secondary)">
                      Target completion
                    </label>
                    <Input
                      id="stage-target"
                      type="date"
                      value={selectedStage.targetDate}
                      onChange={(e) => updateStageField(selectedStage.number, "targetDate", e.target.value)}
                    />
                    {laterStagesCount > 0 && (
                      <span className="text-[11px] text-(--color-warning)">
                        Moving this shifts {laterStagesCount} later stage{laterStagesCount > 1 ? "s" : ""} · review
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-(--color-text-secondary)">Completion</span>
                    <div className="flex gap-2.5 items-center">
                      <div className="flex-1">
                        <ProgressBar percent={displayPercent} color={selectedStage.color} />
                      </div>
                      {selectedStage.deriveProgress ? (
                        <span className="text-[13px] font-mono font-semibold text-(--color-text-primary)">{displayPercent}%</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          aria-label="Manual completion percent"
                          value={selectedStage.manualPercent}
                          onChange={(e) =>
                            updateStageField(selectedStage.number, "manualPercent", Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                          }
                          className="w-16 text-[13px] font-mono font-semibold border border-(--color-border-strong) rounded-(--radius-sm) px-2 py-1"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-(--color-border) rounded-(--radius-md) bg-(--color-bg)">
                  <ToggleSwitch
                    id="toggle-gate"
                    checked={selectedStage.clientGate}
                    onChange={(v) => updateStageField(selectedStage.number, "clientGate", v)}
                    label="Client approval gate"
                    hint="Blocks advance until approved"
                  />
                  <ToggleSwitch
                    id="toggle-visible"
                    checked={selectedStage.visibleToClient}
                    onChange={(v) => updateStageField(selectedStage.number, "visibleToClient", v)}
                    label="Visible to client"
                    hint="Shows on their timeline"
                  />
                  <ToggleSwitch
                    id="toggle-derive"
                    checked={selectedStage.deriveProgress}
                    onChange={(v) => updateStageField(selectedStage.number, "deriveProgress", v)}
                    label="Derive % from milestones"
                    hint="Off means set it by hand"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[13px] font-semibold text-(--color-text-primary)">
                      Milestones <span className="font-mono font-normal text-[11px] text-(--color-text-secondary)">{totalMilestones}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      {isLockedStage && (
                        <span className="text-[11px] text-(--color-text-tertiary)">Locked — only the active stage can tick milestones</span>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => addMilestone(selectedStage.number)}>
                        + Add milestone
                      </Button>
                    </div>
                  </div>

                  <div className="border border-(--color-border) rounded-(--radius-md) overflow-hidden overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-[26px_28px_1fr_140px_120px_30px] gap-2.5 px-3.5 py-2.5 bg-(--color-bg) border-b border-(--color-border) text-[11px] font-semibold text-(--color-text-secondary)">
                        <span></span>
                        <span></span>
                        <span>Milestone</span>
                        <span>Owner</span>
                        <span>Due</span>
                        <span></span>
                      </div>
                      {selectedStage.milestones.length === 0 && (
                        <div className="py-8 text-center text-xs text-(--color-text-secondary)">No milestones yet — add the first one.</div>
                      )}
                      {selectedStage.milestones.map((m, idx) => (
                        <div
                          key={m.id}
                          className="grid grid-cols-[26px_28px_1fr_140px_120px_30px] gap-2.5 px-3.5 py-2.5 border-b border-(--color-border) last:border-b-0 items-center"
                        >
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => moveMilestone(selectedStage.number, idx, -1)}
                              disabled={idx === 0}
                              aria-label="Move milestone up"
                              className="text-(--color-text-tertiary) disabled:opacity-30"
                            >
                              <Icon name="chevron-down" size={11} className="rotate-180" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMilestone(selectedStage.number, idx, 1)}
                              disabled={idx === selectedStage.milestones.length - 1}
                              aria-label="Move milestone down"
                              className="text-(--color-text-tertiary) disabled:opacity-30"
                            >
                              <Icon name="chevron-down" size={11} />
                            </button>
                          </div>
                          <input
                            type="checkbox"
                            checked={m.isComplete}
                            disabled={isLockedStage}
                            aria-label={`Mark "${m.title}" complete`}
                            onChange={(e) => updateMilestone(selectedStage.number, m.id, { isComplete: e.target.checked })}
                            className="rounded justify-self-center"
                          />
                          <input
                            aria-label="Milestone title"
                            value={m.title}
                            onChange={(e) => updateMilestone(selectedStage.number, m.id, { title: e.target.value })}
                            className="input-field !py-1.5 !text-[13px]"
                          />
                          <select
                            aria-label="Milestone owner"
                            value={m.ownerId}
                            onChange={(e) => updateMilestone(selectedStage.number, m.id, { ownerId: e.target.value })}
                            className="input-field !py-1.5 !text-[12.5px]"
                          >
                            {teamOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            aria-label="Milestone due date"
                            value={m.dueDate}
                            onChange={(e) => updateMilestone(selectedStage.number, m.id, { dueDate: e.target.value })}
                            className="input-field !py-1.5 !text-[11.5px] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => removeMilestone(selectedStage.number, m.id)}
                            aria-label={`Remove milestone "${m.title}"`}
                            className="justify-self-center text-(--color-text-tertiary) hover:text-(--color-danger)"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {docCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.ADMIN.PROJECT_DOCUMENTS(id))}
                    className="flex items-center justify-between text-xs px-4 py-3 border border-(--color-border) rounded-(--radius-md) bg-(--color-bg) text-(--color-text-secondary) hover:text-(--color-portal-primary) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)"
                  >
                    <span>
                      {docCount} document{docCount > 1 ? "s" : ""} filed under this stage
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      View in Document management <Icon name="arrow-up-right" size={13} />
                    </span>
                  </button>
                )}

                {isCompletedStage && (
                  <div className="flex items-center gap-2 px-4 py-3 border border-(--color-success) rounded-(--radius-md)" style={{ background: "var(--color-success-bg)" }}>
                    <Icon name="circle-check" size={16} className="text-(--color-success) flex-shrink-0" />
                    <span className="text-[12.5px] font-semibold text-(--color-text-primary)">
                      This stage is complete{selectedStage.completedAt ? ` — ${selectedStage.completedAt}` : ""}.
                    </span>
                  </div>
                )}

                {isLockedStage && (
                  <div className="flex items-center gap-2 px-4 py-3 border border-(--color-border) rounded-(--radius-md) bg-(--color-bg)">
                    <Icon name="lock" size={15} className="text-(--color-text-tertiary) flex-shrink-0" />
                    <span className="text-[12.5px] text-(--color-text-secondary)">
                      Locked for work until Stage {currentActiveNumber} advances. Structure, dates and milestone details can still be edited here.
                    </span>
                  </div>
                )}

                {isActiveStage && (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 rounded-(--radius-md) border"
                    style={{
                      borderColor: canAdvance ? "var(--color-success)" : "var(--color-warning)",
                      background: canAdvance ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold text-(--color-text-primary)">
                        {nextNumber <= stages.length ? `Advance to stage ${nextNumber}?` : "Complete final stage?"}
                      </span>
                      <span className="text-xs text-(--color-text-secondary)">
                        {canAdvance
                          ? "All milestones are closed and the client gate condition is met."
                          : `Cannot advance yet — ${outstanding.join(" and ")}.`}
                      </span>
                    </div>
                    <Button variant={canAdvance ? "primary" : "secondary"} onClick={handleAdvance} disabled={!canAdvance || isSaving}>
                      {canAdvance ? "Advance stage" : `Advance stage — ${outstanding.length} check${outstanding.length > 1 ? "s" : ""} outstanding`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
