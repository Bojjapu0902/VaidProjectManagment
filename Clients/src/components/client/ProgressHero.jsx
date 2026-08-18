import { getStageByNumber } from "../../constants/stages";

export default function ProgressHero({ project }) {
  const stage = getStageByNumber(project.currentStage);
  return (
    <div
      className="rounded-(--radius-lg) p-6 text-white relative overflow-hidden mb-4.5"
      style={{
        background: `linear-gradient(135deg, var(--color-portal-primary) 0%, var(--color-portal-primary-dark) 100%)`,
      }}
    >
      <div
        className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full bg-white/6"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-white/70">
            {project.title}
          </div>
          <div className="text-[19px] font-bold mt-1">Project overview</div>
        </div>
        <span className="bg-white/18 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
          Stage {project.currentStage} of 8 · {stage.statusLabel}
        </span>
      </div>
      <div className="flex items-baseline gap-2.5 mt-4.5 relative z-10">
        <span className="text-[34px] font-extrabold">{project.progressPercent}%</span>
        <span className="text-[12.5px] text-white/75">
          complete · on track for {new Date(project.timeline.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} handover
        </span>
      </div>
      <div className="h-2 bg-white/20 rounded-full mt-3 relative z-10">
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${project.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
