import { STATUS_BADGE_STYLES } from "../../constants/stages";

export function StageBadge({ stageNumber, label }) {
  const style = STATUS_BADGE_STYLES[stageNumber] || STATUS_BADGE_STYLES[1];
  return (
    <span className="badge" style={{ background: style.bg, color: style.text }}>
      {label}
    </span>
  );
}

const SEMANTIC_STYLES = {
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  danger: { bg: "var(--color-danger-bg)", text: "var(--color-danger)" },
  info: { bg: "var(--color-info-bg)", text: "var(--color-info)" },
  neutral: { bg: "var(--color-bg)", text: "var(--color-text-secondary)" },
};

export function Badge({ variant = "neutral", children }) {
  const style = SEMANTIC_STYLES[variant] || SEMANTIC_STYLES.neutral;
  return (
    <span className="badge" style={{ background: style.bg, color: style.text }}>
      {children}
    </span>
  );
}
