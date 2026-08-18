import Icon from "../common/Icon";
import clsx from "clsx";

const DELTA_COLOR = {
  up: "text-(--color-success)",
  flat: "text-(--color-text-tertiary)",
  warn: "text-(--color-warning)",
};

export default function StatCard({ label, value, icon, iconBg, iconColor, delta, deltaType = "flat" }) {
  return (
    <div className="card p-[18px_20px]">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">
          {label}
        </span>
        <div
          className="w-[30px] h-[30px] rounded-(--radius-sm) flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon name={icon} size={15} />
        </div>
      </div>
      <div className="text-[28px] font-extrabold text-(--color-text-primary) mt-2.5 tracking-tight">
        {value}
      </div>
      {delta && (
        <div className={clsx("text-xs font-semibold mt-1.5 flex items-center gap-1", DELTA_COLOR[deltaType])}>
          {deltaType === "up" && <Icon name="arrow-up-right" size={13} />}
          {deltaType === "warn" && <Icon name="alert-triangle" size={13} />}
          {delta}
        </div>
      )}
    </div>
  );
}
