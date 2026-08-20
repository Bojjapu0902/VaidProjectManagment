import { useState } from "react";
import clsx from "clsx";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader } from "../../components/common/Card";
import NotificationList from "../../components/common/NotificationList";
import useAuth from "../../hooks/useAuth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

// Every notification type resolves to the exact project context it concerns —
// clicking a notification should land you there, not on a generic project page.
const DEEP_LINKS = {
  stage_completed: ROUTES.ADMIN.PROJECT_STAGES,
  approval_requested: ROUTES.ADMIN.PROJECT_APPROVALS,
  document_uploaded: ROUTES.ADMIN.PROJECT_DOCUMENTS,
  feedback_received: ROUTES.ADMIN.PROJECT_MESSAGES,
  deadline_reminder: ROUTES.ADMIN.PROJECT_STAGES,
  status_change: ROUTES.ADMIN.PROJECT_DETAIL,
};

const getDeepLink = (n) => {
  if (!n.projectId) return null;
  const toRoute = DEEP_LINKS[n.type] || ROUTES.ADMIN.PROJECT_DETAIL;
  return toRoute(n.projectId);
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "approvals", label: "Approvals" },
];

const PREFERENCE_EVENTS = [
  { key: "stage_completed", label: "Stage completed", inApp: true, email: true },
  { key: "approval_requested", label: "Approval requested", inApp: true, email: true, emailLocked: true },
  { key: "document_uploaded", label: "New document uploaded", inApp: true, email: false },
  { key: "feedback_received", label: "Feedback received", inApp: true, email: true },
  { key: "deadline_reminder", label: "Deadline reminder", inApp: true, email: false },
  { key: "status_change", label: "Any status change", inApp: false, email: false },
];

function ToggleSwitch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "w-8 h-[17px] rounded-(--radius-pill) relative transition-colors flex-shrink-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)",
        disabled ? "bg-(--color-navy)/50 cursor-not-allowed" : checked ? "bg-(--color-navy)" : "bg-(--color-border)"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-(--color-surface) transition-all",
          checked ? "right-0.5" : "left-0.5"
        )}
      />
    </button>
  );
}

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });
  const [markAsRead] = useMarkNotificationReadMutation();
  const [filter, setFilter] = useState("all");
  const [prefs, setPrefs] = useState(PREFERENCE_EVENTS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const approvalsCount = notifications.filter((n) => n.type === "approval_requested").length;
  const counts = { all: notifications.length, unread: unreadCount, approvals: approvalsCount };

  const visible = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "approvals") return n.type === "approval_requested";
    return true;
  });

  const updatePref = (key, channel, value) => {
    setPrefs((prev) => prev.map((p) => (p.key === key ? { ...p, [channel]: value } : p)));
  };

  return (
    <>
      <Topbar title="Notifications" subtitle={`${unreadCount} unread`} notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4.5 items-start max-w-4xl">
          <Card padded={false}>
            <CardHeader
              title="Notifications"
              action={
                <button
                  className="text-xs font-semibold text-(--color-navy) disabled:text-(--color-text-tertiary) disabled:cursor-not-allowed"
                  disabled={unreadCount === 0}
                  onClick={() => notifications.filter((n) => !n.isRead).forEach((n) => markAsRead(n.id))}
                >
                  Mark all read
                </button>
              }
            />
            <div className="flex gap-1.5 px-5 py-3 border-b border-(--color-border)">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={clsx(
                    "font-mono text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-(--radius-pill) transition-colors",
                    filter === f.key
                      ? "bg-(--color-navy) text-white"
                      : "bg-(--color-bg) text-(--color-text-secondary) hover:bg-(--color-border)/60"
                  )}
                >
                  {f.label} {counts[f.key]}
                </button>
              ))}
            </div>
            <div className="px-5">
              <NotificationList notifications={visible} onMarkRead={markAsRead} getDeepLink={getDeepLink} />
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Preferences" subtitle="Choose how each event reaches you" />
            <div className="px-5 py-4">
              <div className="grid grid-cols-[1fr_54px_54px] gap-2.5 pb-2.5 mb-1 border-b border-(--color-border) text-[11px] font-semibold text-(--color-text-secondary)">
                <span>Event</span>
                <span className="text-center">In-app</span>
                <span className="text-center">Email</span>
              </div>
              {prefs.map((p) => (
                <div key={p.key} className="grid grid-cols-[1fr_54px_54px] gap-2.5 items-center py-2 text-[12.5px] text-(--color-text-primary)">
                  <span>{p.label}</span>
                  <span className="flex justify-center">
                    <ToggleSwitch
                      checked={p.inApp}
                      onChange={(v) => updatePref(p.key, "inApp", v)}
                      label={`${p.label} — in-app notifications`}
                    />
                  </span>
                  <span className="flex justify-center">
                    <ToggleSwitch
                      checked={p.email}
                      disabled={p.emailLocked}
                      onChange={(v) => updatePref(p.key, "email", v)}
                      label={`${p.label} — email notifications`}
                    />
                  </span>
                </div>
              ))}
              <div className="mt-3 px-3.5 py-3 rounded-(--radius-sm) bg-(--color-bg) text-xs leading-relaxed text-(--color-text-secondary)">
                Approval requests always send an email regardless of this setting — the workflow depends on it, so that
                toggle is locked on.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
