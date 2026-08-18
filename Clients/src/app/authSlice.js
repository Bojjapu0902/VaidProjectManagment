import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../services/authService";
import { STORAGE_TOKEN_KEY, STORAGE_REFRESH_KEY, STORAGE_USER_KEY } from "../services/axiosInstance";

const persistedUser = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authService.login({ email, password });
      localStorage.setItem(STORAGE_TOKEN_KEY, data.accessToken);
      localStorage.setItem(STORAGE_REFRESH_KEY, data.refreshToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_REFRESH_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  return true;
});

const initialState = {
  user: persistedUser,
  isAuthenticated: Boolean(persistedUser),
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    // Merges a freshly-saved profile (from PUT /users/:id) into the signed-in
    // user so the UI reflects it immediately, without a full re-login.
    updateLocalUser(state, action) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(state.user));
      } catch {
        // localStorage unavailable — in-memory state still updates
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
      });
  },
});

export const { clearAuthError, updateLocalUser } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
