import Icon from "./Icon";

export function EmptyState({ icon = "folder", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-full bg-(--color-bg) flex items-center justify-center mb-4">
        <Icon name={icon} size={26} className="text-(--color-text-tertiary)" />
      </div>
      <h3 className="text-sm font-bold text-(--color-text-primary)">{title}</h3>
      {description && (
        <p className="text-xs text-(--color-text-secondary) mt-1.5 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 22 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-(--color-border) border-t-(--color-portal-primary)"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={28} />
    </div>
  );
}
