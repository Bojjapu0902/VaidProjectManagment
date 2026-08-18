import { STAGES } from "../../constants/stages";
import Icon from "./Icon";
import clsx from "clsx";

/**
 * Visual lifecycle tracker. Reused on:
 *  - Admin Project Detail / Stage Management
 *  - Client Project Overview / Timeline
 *
 * currentStage: 1-based, the stage currently in progress.
 * orientation: 'horizontal' (desktop) | 'vertical' (mobile / sidebar use)
 * stages: optional override list ({ number, shortName, color }[]) — defaults
 *   to the standard 8-stage lifecycle. Pass a project's custom `lifecycle`
 *   (mapped to this shape) to reflect the stages defined at project creation.
 */
export default function StageTracker({ currentStage = 1, orientation = "horizontal", stages = STAGES }) {
  if (orientation === "vertical") {
    return (
      <div className="flex flex-col">
        {stages.map((stage, idx) => {
          const isDone = stage.number < currentStage;
          const isCurrent = stage.number === currentStage;
          return (
            <div key={stage.number} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: isCurrent || isDone ? stage.color : "var(--color-border)", color: isDone || isCurrent ? "#fff" : "var(--color-text-tertiary)" }}
                >
                  {isDone ? <Icon name="check" size={14} /> : stage.number}
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className="w-0.5 flex-1 my-1"
                    style={{ background: isDone ? "#22C55E" : "var(--color-border)", minHeight: 24 }}
                  />
                )}
              </div>
              <div className={clsx("pb-6", isCurrent && "font-bold")}>
                <p className="text-[13px] text-(--color-text-primary)">{stage.shortName}</p>
                {isCurrent && (
                  <p className="text-[11px] text-(--color-text-secondary) mt-0.5">Current stage</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1.5">
      {stages.map((stage, idx) => {
        const isDone = stage.number < currentStage;
        const isCurrent = stage.number === currentStage;
        return (
          <div key={stage.number} className="flex flex-col items-center flex-1 min-w-[74px] relative">
            {idx > 0 && (
              <div
                className="absolute top-[17px] h-0.5 z-0"
                style={{
                  left: "-50%",
                  width: "100%",
                  background: stage.number <= currentStage ? "#22C55E" : "var(--color-border)",
                }}
              />
            )}
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-bold z-10 border-[3px]"
              style={{
                background: isCurrent || isDone ? stage.color : "var(--color-border)",
                color: isCurrent || isDone ? "#fff" : "var(--color-text-tertiary)",
                borderColor: "var(--color-surface)",
              }}
            >
              {isDone ? <Icon name="check" size={15} /> : stage.number}
            </div>
            <div
              className={clsx(
                "text-[10.5px] font-semibold text-center mt-2 leading-tight max-w-[80px]",
                isCurrent ? "text-(--color-text-primary)" : "text-(--color-text-secondary)"
              )}
            >
              {stage.shortName}
            </div>
          </div>
        );
      })}
    </div>
  );
}
