import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";
import { isAdminPortalRole } from "../../constants/roles";

/**
 * Guards a portal's routes. portal: 'admin' | 'client'.
 * Redirects to login if unauthenticated, or to the user's correct
 * portal if they try to access the wrong one.
 */
export default function ProtectedRoute({ portal }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const userIsAdminPortal = isAdminPortalRole(user.role);
  const onCorrectPortal = portal === "admin" ? userIsAdminPortal : !userIsAdminPortal;

  if (!onCorrectPortal) {
    return (
      <Navigate
        to={userIsAdminPortal ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.DASHBOARD}
        replace
      />
    );
  }

  return <Outlet />;
}
