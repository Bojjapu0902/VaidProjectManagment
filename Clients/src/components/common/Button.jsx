import clsx from "clsx";

const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  approve: "btn-approve",
  danger: "btn-danger",
  ghost: "bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg)",
};

const SIZE_CLASS = {
  sm: "text-xs px-3 py-1.5",
  md: "", // default sizing comes from .btn
  lg: "text-sm px-5 py-3",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  iconPosition = "left",
  className = "",
  type = "button",
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "btn",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className
      )}
      {...rest}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
}
