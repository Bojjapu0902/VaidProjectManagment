import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import useAuth from "../../hooks/useAuth";
import { useGetNotificationsQuery } from "../../app/api/apiSlice";

export default function ClientLayout() {
  const { user } = useAuth();
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div data-portal="client" className="flex min-h-screen bg-(--color-bg)">
      <Sidebar
        portal="client"
        user={user}
        brandTag="CLIENT PORTAL"
        badgeCounts={{ notifications: unreadCount }}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet context={{ unreadCount }} />
      </div>
    </div>
  );
}
