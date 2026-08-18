import Icon from "../common/Icon";
import { Badge } from "../common/Badge";
import { formatDate } from "../../utils/format";

const URGENCY_VARIANT = {
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
  "client-action": "success",
};

const URGENCY_ICON = {
  warning: { icon: "file-text", bg: "var(--color-danger-bg)", color: "var(--color-stage-6)" },
  danger: { icon: "palette", bg: "#EFE9FB", color: "var(--color-stage-3)" },
  neutral: { icon: "blueprint", bg: "var(--color-info-bg)", color: "var(--color-stage-5)" },
  "client-action": { icon: "photo", bg: "var(--color-success-bg)", color: "var(--color-stage-2)" },
};

export function ApprovalQueueList({ approvals = [] }) {
  if (approvals.length === 0) {
    return <p className="text-sm text-(--color-text-secondary) py-6 text-center">No pending approvals.</p>;
  }
  return (
    <div>
      {approvals.map((item) => {
        const iconCfg = URGENCY_ICON[item.urgency] || URGENCY_ICON.neutral;
        return (
          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
            <div
              className="w-8 h-8 rounded-(--radius-sm) flex items-center justify-center flex-shrink-0"
              style={{ background: iconCfg.bg, color: iconCfg.color }}
            >
              <Icon name={iconCfg.icon} size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">
                {item.documentName}
              </div>
              <div className="text-[11.5px] text-(--color-text-secondary) mt-0.5 truncate">
                {item.projectName} · {item.status === "internal_review" ? "internal QA" : "awaiting client review"}
              </div>
            </div>
            <Badge variant={URGENCY_VARIANT[item.urgency] || "neutral"}>{item.dueIn}</Badge>
          </div>
        );
      })}
    </div>
  );
}

export function DeadlineList({ deadlines = [] }) {
  return (
    <div>
      {deadlines.map((item) => {
        const date = new Date(item.date);
        return (
          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
            <div className="w-[42px] h-[42px] rounded-(--radius-md) bg-(--color-portal-primary-light) flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-(--color-portal-primary-on-tint) uppercase">
                {formatDate(date, "MMM")}
              </span>
              <span className="text-[15px] font-extrabold text-(--color-portal-primary-on-tint) leading-none">
                {formatDate(date, "d")}
              </span>
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-(--color-text-primary)">{item.title}</div>
              <div className="text-[11px] text-(--color-text-secondary)">{item.projectName}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Accepts either a notification-shaped item ({ title, message, time, color })
// or the legacy actor/action/target shape, so real Notification documents
// from MongoDB and any remaining hand-built entries render the same way.
export function ActivityFeed({ activity = [] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-(--color-text-secondary) py-6 text-center">No recent activity.</p>;
  }
  return (
    <div>
      {activity.map((item) => (
        <div key={item.id} className="flex gap-3 py-2.75 border-b border-(--color-border) last:border-0">
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color || "var(--color-navy)" }} />
          <div>
            <p className="text-[12.5px] text-(--color-text-primary) leading-snug">
              {item.title ? (
                <>
                  <span className="font-bold">{item.title}</span>
                  {item.message ? ` — ${item.message}` : ""}
                </>
              ) : (
                <>
                  <span className="font-bold">{item.actorName}</span> {item.action}{" "}
                  <span className="font-bold">{item.target}</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
