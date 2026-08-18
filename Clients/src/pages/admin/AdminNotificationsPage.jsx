import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader } from "../../components/common/Card";
import NotificationList from "../../components/common/NotificationList";
import useAuth from "../../hooks/useAuth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });
  const [markAsRead] = useMarkNotificationReadMutation();

  return (
    <>
      <Topbar title="Notifications" subtitle={`${notifications.filter((n) => !n.isRead).length} unread`} notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <Card padded={false}>
          <CardHeader
            title="All notifications"
            action={
              <button className="text-xs font-semibold text-(--color-navy)" onClick={() => notifications.forEach((n) => markAsRead(n.id))}>
                Mark all as read
              </button>
            }
          />
          <div className="px-5">
            <NotificationList notifications={notifications} onMarkRead={markAsRead} />
          </div>
        </Card>
      </div>
    </>
  );
}
