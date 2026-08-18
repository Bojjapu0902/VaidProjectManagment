import { useNavigate } from "react-router-dom";
import { StageBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

const EMOJI_BY_TYPE = {
  Residential: "🏠",
  Commercial: "🏢",
  Civic: "🏛️",
};

export default function ProjectListItem({ project }) {
  const navigate = useNavigate();
  const stage = getStageByNumber(project.currentStage);

  return (
    <div
      className="flex items-center gap-3.5 py-3.5 border-b border-(--color-border) last:border-0 cursor-pointer hover:bg-(--color-bg)/60 -mx-2 px-2 rounded-(--radius-md)"
      onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(project.id))}
    >
      <div
        className="w-10 h-10 rounded-(--radius-md) flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${stage.color}1A` }}
      >
        {EMOJI_BY_TYPE[project.type] || "🏗️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-(--color-text-primary) truncate">
          {project.title}
        </div>
        <div className="text-xs text-(--color-text-secondary) mt-0.5">
          Client: {project.clientName}
        </div>
      </div>
      <StageBadge stageNumber={project.currentStage} label={stage.statusLabel} />
      <div className="w-[120px] flex-shrink-0">
        <ProgressBar percent={project.progressPercent} color={stage.color} />
        <div className="text-[11px] text-(--color-text-secondary) mt-1 text-right">
          {project.progressPercent}% · Stage {project.currentStage}/8
        </div>
      </div>
    </div>
  );
}
