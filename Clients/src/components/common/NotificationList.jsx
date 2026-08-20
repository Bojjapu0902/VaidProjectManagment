import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import Icon from "./Icon";
import { formatRelativeTime } from "../../utils/format";

const TYPE_ICON = {
  approval_requested: { icon: "checklist", bg: "var(--color-warning-bg)", color: "var(--color-warning)" },
  document_uploaded: { icon: "file-text", bg: "var(--color-info-bg)", color: "var(--color-info)" },
  deadline_reminder: { icon: "calendar-event", bg: "var(--color-danger-bg)", color: "var(--color-danger)" },
  stage_completed: { icon: "circle-check", bg: "var(--color-success-bg)", color: "var(--color-success)" },
  feedback_received: { icon: "message-circle", bg: "var(--color-portal-primary-light)", color: "var(--color-portal-primary-on-tint)" },
  status_change: { icon: "arrow-up-right", bg: "var(--color-navy-light)", color: "var(--color-navy-on-tint)" },
};

// notifications carry a `type` + `projectId`; this resolves the exact
// in-app destination each event type deep-links to. Optional so callers
// that don't pass `getDeepLink` keep the old click-to-mark-read-only behaviour.
export default function NotificationList({ notifications = [], onMarkRead, getDeepLink }) {
  const navigate = useNavigate();

  if (notifications.length === 0) {
    return <p className="text-sm text-(--color-text-secondary) py-10 text-center">You're all caught up.</p>;
  }

  const handleClick = (n) => {
    onMarkRead?.(n.id);
    const href = getDeepLink?.(n);
    if (href) navigate(href);
  };

  return (
    <div>
      {notifications.map((n) => {
        const cfg = TYPE_ICON[n.type] || TYPE_ICON.document_uploaded;
        return (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            className={clsx(
              "flex items-start gap-3.5 py-4 border-b border-(--color-border) last:border-0 cursor-pointer hover:bg-(--color-bg)/50 -mx-2 px-2 rounded-(--radius-md) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-portal-primary)",
              // Unread is signalled by a tint *and* a dot — never colour alone.
              !n.isRead && "bg-(--color-portal-primary-light)/50"
            )}
            onClick={() => handleClick(n)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(n);
              }
            }}
          >
            <div
              className="w-9 h-9 rounded-(--radius-sm) flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <Icon name={cfg.icon} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-(--color-text-primary)">{n.title}</span>
                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-(--color-danger)" aria-label="Unread" />}
              </div>
              <p className="text-[13px] text-(--color-text-secondary) mt-0.5">{n.message}</p>
              <p className="text-[11px] text-(--color-text-tertiary) mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
            {getDeepLink?.(n) && (
              <Icon name="chevron-right" size={15} className="text-(--color-text-tertiary) flex-shrink-0 mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
