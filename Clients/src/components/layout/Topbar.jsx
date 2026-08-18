import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { toggleTheme, selectTheme } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";

export default function Topbar({ title, subtitle, actions, notificationsRoute, hasUnread = false }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { logout, isAdminPortal } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="bg-(--color-surface) border-b border-(--color-border) px-8 py-4.5 flex items-center justify-between">
      <div>
        <h1 className="text-[21px] font-bold text-(--color-text-primary) leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] text-(--color-text-secondary) mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3.5">
        {actions}
        <button
          className="icon-btn"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => dispatch(toggleTheme())}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
        <button
          className="icon-btn"
          aria-label="Notifications"
          onClick={() => navigate(notificationsRoute)}
        >
          <Icon name="bell" size={17} />
          {hasUnread && (
            <span className="absolute top-1.5 right-[7px] w-[7px] h-[7px] rounded-full bg-(--color-danger) border-2 border-(--color-surface)" />
          )}
        </button>
        <button className="icon-btn" aria-label="Log out" onClick={handleLogout} title="Log out">
          <Icon name="log-out" size={17} />
        </button>
      </div>
    </header>
  );
}
