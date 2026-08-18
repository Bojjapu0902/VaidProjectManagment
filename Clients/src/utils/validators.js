export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

export const isRequired = (value) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

export const minLength = (value, len) => (value || "").length >= len;
