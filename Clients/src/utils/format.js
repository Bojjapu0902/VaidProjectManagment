import { format, formatDistanceToNow, parseISO } from "date-fns";

export const formatCurrency = (amount, currency = "INR") => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateInput, pattern = "MMM d, yyyy") => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  try {
    return format(date, pattern);
  } catch {
    return "—";
  }
};

export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
};

export const formatFileSize = (sizeStr) => sizeStr || "—";

export const truncate = (str, max = 40) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str;
