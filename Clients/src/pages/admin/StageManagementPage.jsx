import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import StageTracker from "../../components/common/StageTracker";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import FileUpload from "../../components/common/FileUpload";
import ProgressBar from "../../components/common/ProgressBar";
import { PageLoader } from "../../components/common/EmptyState";
import { useGetProjectByIdQuery, useUpdateStageMutation } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { STAGES, getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

export default function StageManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const [updateStage, { isLoading: isUpdating }] = useUpdateStageMutation();
  const [selectedStage, setSelectedStage] = useState(null);
  const [milestones, setMilestones] = useState({});

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const activeStageNumber = selectedStage || project.currentStage;
  const activeStage = getStageByNumber(activeStageNumber);

  const toggleMilestone = (item) => {
    setMilestones((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const completedCount = activeStage.items.filter((i) => milestones[i]).length;
  const milestonePercent = Math.round((completedCount / activeStage.items.length) * 100);

  const handleAdvanceStage = async () => {
    try {
      await updateStage({
        projectId: id,
        stageNumber: activeStageNumber,
        payload: { status: "completed" },
      }).unwrap();
      dispatch(pushToast(`Stage ${activeStageNumber} marked complete. Client approval requested.`, "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not update stage", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Stage management" subtitle={project.title} notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />

      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false} className="mb-5">
          <CardBody>
            <StageTracker currentStage={project.currentStage} />
          </CardBody>
        </Card>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {STAGES.map((s) => (
            <button
              key={s.number}
              onClick={() => setSelectedStage(s.number)}
              className="px-4 py-2 rounded-(--radius-md) text-xs font-semibold whitespace-nowrap border"
              style={{
                background: activeStageNumber === s.number ? s.color : "var(--color-surface)",
                color: activeStageNumber === s.number ? "#fff" : "var(--color-text-secondary)",
                borderColor: activeStageNumber === s.number ? s.color : "var(--color-border)",
              }}
            >
              {s.number}. {s.shortName}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-4.5">
          <div>
            <Card padded={false} className="mb-4.5">
              <CardHeader title={`Stage ${activeStage.number}: ${activeStage.name}`} subtitle={activeStage.statusLabel} />
              <CardBody>
                <p className="text-xs font-semibold text-(--color-text-secondary) mb-3">Milestone checklist</p>
                <div className="space-y-2 mb-4">
                  {activeStage.items.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-(--radius-md) bg-(--color-bg) cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!milestones[item]}
                        onChange={() => toggleMilestone(item)}
                        className="rounded"
                      />
                      <span
                        className={`text-sm ${milestones[item] ? "line-through text-(--color-text-tertiary)" : "text-(--color-text-primary)"}`}
                      >
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
                <ProgressBar percent={milestonePercent} color={activeStage.color} showLabel />
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader title="Upload stage documents" />
              <CardBody>
                <FileUpload multiple />
              </CardBody>
            </Card>
          </div>

          <div>
            <Card padded={false}>
              <CardHeader title="Stage actions" />
              <CardBody className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleAdvanceStage}
                  disabled={isUpdating || milestonePercent < 100}
                >
                  {isUpdating ? "Updating…" : "Request client approval"}
                </Button>
                {milestonePercent < 100 && (
                  <p className="text-xs text-(--color-text-tertiary) text-center">
                    Complete all milestones to request approval
                  </p>
                )}
                <Button variant="secondary" className="w-full justify-center">
                  Save as draft
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
