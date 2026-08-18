export default function ProgressBar({ percent = 0, color = "var(--color-portal-primary)", height = 6, showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div>
      <div
        className="rounded-full overflow-hidden bg-(--color-bg)"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <div className="text-[11px] text-(--color-text-secondary) mt-1 text-right">{clamped}%</div>
      )}
    </div>
  );
}
