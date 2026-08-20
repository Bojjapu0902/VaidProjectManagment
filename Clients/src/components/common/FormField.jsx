import { forwardRef, useId } from "react";
import clsx from "clsx";

export const Input = forwardRef(function Input(
  { label, error, id, className = "", containerClassName = "", ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || rest.name || autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "input-field",
          error && "border-(--color-danger)",
          className
        )}
        {...rest}
      />
      {error && <p id={errorId} className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, options = [], id, className = "", containerClassName = "", ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || rest.name || autoId;
  const errorId = `${selectId}-error`;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={clsx("input-field", error && "border-(--color-danger)", className)}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={errorId} className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, id, className = "", containerClassName = "", rows = 4, ...rest },
  ref
) {
  const autoId = useId();
  const textareaId = id || rest.name || autoId;
  const errorId = `${textareaId}-error`;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        rows={rows}
        className={clsx("input-field resize-none", error && "border-(--color-danger)", className)}
        {...rest}
      />
      {error && <p id={errorId} className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});
