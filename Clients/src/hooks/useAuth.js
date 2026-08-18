import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  loginUser,
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthStatus,
  selectAuthError,
} from "../app/authSlice";
import { isAdminPortalRole } from "../constants/roles";

export default function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const login = useCallback(
    (credentials) => dispatch(loginUser(credentials)),
    [dispatch]
  );

  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading: status === "loading",
    error,
    login,
    logout,
    isAdminPortal: user ? isAdminPortalRole(user.role) : null,
  };
}
