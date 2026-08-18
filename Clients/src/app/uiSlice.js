import { createSlice, nanoid } from "@reduxjs/toolkit";

const STORAGE_THEME_KEY = "archpro_theme";

const persistedTheme = (() => {
  try {
    return localStorage.getItem(STORAGE_THEME_KEY) || "light";
  } catch {
    return "light";
  }
})();

const initialState = {
  sidebarCollapsed: false,
  theme: persistedTheme, // light | dark
  toasts: [], // { id, message, variant }
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme(state, action) {
      state.theme = action.payload;
      try {
        localStorage.setItem(STORAGE_THEME_KEY, action.payload);
      } catch {
        // localStorage unavailable — theme just won't persist across reloads
      }
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_THEME_KEY, state.theme);
      } catch {
        // localStorage unavailable — theme just won't persist across reloads
      }
    },
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare(message, variant = "info") {
        return { payload: { id: nanoid(), message, variant } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setTheme, toggleTheme, pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;

export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectTheme = (state) => state.ui.theme;
export const selectToasts = (state) => state.ui.toasts;
