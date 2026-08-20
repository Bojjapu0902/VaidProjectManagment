import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader } from "../../components/common/Card";
import NotificationList from "../../components/common/NotificationList";
import useAuth from "../../hooks/useAuth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

// Clients receive four kinds of notification, not the full set the team sees
// (feedback between team members and internal deadline reminders never reach
// a client). Filtering defensively here means the UI holds this rule even if
// the API ever returns a broader feed for a client user.
const CLIENT_VISIBLE_TYPES = ["stage_completed", "approval_requested", "document_uploaded", "status_change"];

// Every notification carries a deep link into the exact project context it
// concerns, using client-prefixed routes — a notification is the navigation.
const DEEP_LINKS = {
  stage_completed: ROUTES.CLIENT.PROJECT_TIMELINE,
  approval_requested: ROUTES.CLIENT.PROJECT_APPROVALS,
  document_uploaded: ROUTES.CLIENT.PROJECT_DOCUMENTS,
  status_change: ROUTES.CLIENT.PROJECT_DETAIL,
};

const getDeepLink = (n) => {
  if (!n.projectId) return null;
  const toRoute = DEEP_LINKS[n.type];
  return toRoute ? toRoute(n.projectId) : null;
};

export default function ClientNotificationsPage() {
  const { user } = useAuth();
  const { data: allNotifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });
  const [markAsRead] = useMarkNotificationReadMutation();

  const notifications = allNotifications.filter((n) => CLIENT_VISIBLE_TYPES.includes(n.type));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS}
        hasUnread={unreadCount > 0}
      />
      <div className="p-8 flex-1 overflow-y-auto flex justify-center">
        <Card padded={false} className="w-full max-w-2xl">
          <CardHeader
            title="Notifications"
            action={
              <button
                className="text-xs font-semibold text-(--color-portal-primary) disabled:text-(--color-text-tertiary) disabled:cursor-not-allowed"
                disabled={unreadCount === 0}
                onClick={() => notifications.filter((n) => !n.isRead).forEach((n) => markAsRead(n.id))}
              >
                Mark all read
              </button>
            }
          />
          <div className="px-5">
            <NotificationList notifications={notifications} onMarkRead={markAsRead} getDeepLink={getDeepLink} />
          </div>
        </Card>
      </div>
    </>
  );
}
