import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { selectTheme } from "../app/uiSlice";

/**
 * Applies the current theme to <html data-theme="..."> so tokens.css's
 * [data-theme="dark"] block takes effect. Mount once near the app root.
 */
export default function useThemeSync() {
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return theme;
}
