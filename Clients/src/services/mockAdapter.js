// Mock adapter — simulates the network so every service function has the
// exact same async shape ({ data }) whether it's hitting mocks or a real
// Axios call. Swap USE_MOCKS to false (or set VITE_USE_MOCKS=false) and the
// services below will call the real axiosInstance instead. No component
// code needs to change either way.

const LATENCY_MS = 350;

export const mockResolve = (data) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ data }), LATENCY_MS);
  });

export const mockReject = (message = "Request failed", status = 400) =>
  new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      error.response = { status, data: { message } };
      reject(error);
    }, LATENCY_MS);
  });
