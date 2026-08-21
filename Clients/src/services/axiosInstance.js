import axios from "axios";

// In production this points at the real API. For now USE_MOCKS short-circuits
// every service call before it leaves the browser (see services/mockAdapter.js).
export const API_BASE_URL = "https://vaidprojectmanagment.onrender.com/api/v1";
export const USE_MOCKS = false;

export const STORAGE_TOKEN_KEY = "archpro_access_token";
export const STORAGE_REFRESH_KEY = "archpro_refresh_token";
export const STORAGE_USER_KEY = "archpro_user";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clearSession = () => {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_REFRESH_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
};

// Dedupes concurrent 401s during the same expiry so a page that fires several
// requests at once triggers exactly one refresh call, not one per request.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(STORAGE_REFRESH_KEY);
  if (!refreshToken) throw new Error("No refresh token available");

  // Plain axios, not axiosInstance — must bypass the interceptors below so a
  // failed refresh can't recurse into itself.
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
  localStorage.setItem(STORAGE_TOKEN_KEY, data.accessToken);
  localStorage.setItem(STORAGE_REFRESH_KEY, data.refreshToken);
  return data.accessToken;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes("/auth/");

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newAccessToken = await refreshPromise;
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(config);
      } catch {
        clearSession();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
