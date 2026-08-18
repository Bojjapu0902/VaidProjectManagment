import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef(function Input(
  { label, error, className = "", containerClassName = "", ...rest },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          "input-field",
          error && "border-(--color-danger)",
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, options = [], className = "", containerClassName = "", ...rest },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <select ref={ref} className={clsx("input-field", error && "border-(--color-danger)", className)} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className = "", containerClassName = "", rows = 4, ...rest },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx("input-field resize-none", error && "border-(--color-danger)", className)}
        {...rest}
      />
      {error && <p className="text-xs text-(--color-danger) mt-1">{error}</p>}
    </div>
  );
});
