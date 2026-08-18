import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import useAuth from "../../hooks/useAuth";
import { useGetNotificationsQuery } from "../../app/api/apiSlice";
import { useGetApprovalsQuery } from "../../app/api/apiSlice";

export default function AdminLayout() {
  const { user } = useAuth();
  const { data: notifications = [] } = useGetNotificationsQuery(user?.id, { skip: !user });
  const { data: approvals = [] } = useGetApprovalsQuery({ pendingOnly: true }, { skip: !user });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div data-portal="admin" className="flex min-h-screen bg-(--color-bg)">
      <Sidebar
        portal="admin"
        user={user}
        brandTag="TEAM WORKSPACE"
        badgeCounts={{ notifications: unreadCount, approvals: approvals.length }}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet context={{ unreadCount }} />
      </div>
    </div>
  );
}
