import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { selectToasts, dismissToast } from "../../app/uiSlice";
import Icon from "./Icon";

const VARIANT_STYLES = {
  info: { bg: "var(--color-info-bg)", text: "var(--color-info)", icon: "circle-check" },
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", icon: "circle-check" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", icon: "alert-triangle" },
  danger: { bg: "var(--color-danger-bg)", text: "var(--color-danger)", icon: "alert-triangle" },
};

export default function ToastContainer() {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 w-80">
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-(--radius-md) shadow-card-md px-4 py-3"
            style={{ background: "var(--color-surface)", border: `1px solid ${style.text}33` }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: style.bg, color: style.text }}
            >
              <Icon name={style.icon} size={15} />
            </div>
            <p className="text-sm text-(--color-text-primary) flex-1 pt-0.5">{toast.message}</p>
            <button onClick={() => dispatch(dismissToast(toast.id))} className="text-(--color-text-tertiary)">
              <Icon name="x" size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
