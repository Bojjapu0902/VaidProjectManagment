import { NavLink } from "react-router-dom";
import clsx from "clsx";
import Icon from "../common/Icon";
import Avatar from "../common/Avatar";
import { ROUTES } from "../../constants/routes";
import { ROLE_LABELS } from "../../constants/roles";
import vaidLogo from "../../images/vaid_logo_white.png";

const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { to: ROUTES.ADMIN.DASHBOARD, icon: "layout-dashboard", label: "Dashboard" },
      { to: ROUTES.ADMIN.PROJECTS, icon: "folder", label: "Projects" },
      { to: ROUTES.ADMIN.TEAM, icon: "users", label: "Team" },
      { to: ROUTES.ADMIN.CLIENTS, icon: "user-circle", label: "Clients" },
    ],
  },
  {
    section: "Workspace",
    items: [
      { to: ROUTES.ADMIN.NOTIFICATIONS, icon: "bell", label: "Notifications", badgeKey: "notifications" },
      { to: ROUTES.ADMIN.REPORTS, icon: "chart-bar", label: "Reports" },
    ],
  },
  {
    section: "System",
    items: [{ to: ROUTES.ADMIN.SETTINGS, icon: "settings", label: "Settings" }],
  },
];

const CLIENT_NAV = [
  {
    section: "My projects",
    items: [
      { to: ROUTES.CLIENT.DASHBOARD, icon: "layout-dashboard", label: "Dashboard" },
      { to: ROUTES.CLIENT.PROJECTS, icon: "folder", label: "Projects" },
    ],
  },
  {
    section: "Workspace",
    items: [
      { to: ROUTES.CLIENT.NOTIFICATIONS, icon: "bell", label: "Notifications", badgeKey: "notifications" },
    ],
  },
  {
    section: "Account",
    items: [{ to: ROUTES.CLIENT.PROFILE, icon: "user-circle", label: "Profile" }],
  },
];

export default function Sidebar({ portal, user, badgeCounts = {}, brandTag }) {
  const nav = portal === "admin" ? ADMIN_NAV : CLIENT_NAV;

  return (
    <aside
      className="w-[236px] flex-shrink-0 flex flex-col py-6 text-white"
      style={{ background: "var(--color-portal-primary)" }}
    >
      <div className="flex items-center gap-2.5 px-6 pb-7 mb-5 border-b border-white/10">
        <img src={vaidLogo} alt="VAID Logo" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="text-[10.5px] font-bold text-white/40 uppercase tracking-wide px-6 pt-3.5 pb-2">
              {group.section}
            </div>
            {group.items.map((item) => {
              const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-6 py-2.5 text-[13.5px] font-medium border-l-[3px]",
                      isActive
                        ? "bg-white/10 text-white border-(--color-amber)"
                        : "text-white/72 border-transparent hover:bg-white/5"
                    )
                  }
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto bg-(--color-amber) text-[#1A1305] text-[10.5px] font-bold px-[7px] py-[1px] rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-6 pt-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-2.5 pt-4">
          <div className="w-[34px] h-[34px] rounded-full bg-white/15 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.avatarInitials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{user?.name}</div>
            <div className="text-[11px] text-white/55 truncate">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
