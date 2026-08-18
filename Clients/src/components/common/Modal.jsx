import Icon from "./Icon";

export default function Modal({ isOpen, onClose, title, children, footer, width = 480 }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-h-[85vh] overflow-y-auto"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h3 className="text-sm font-bold text-(--color-text-primary)">{title}</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-(--color-border)">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
