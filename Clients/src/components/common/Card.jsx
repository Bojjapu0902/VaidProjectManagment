import clsx from "clsx";

export function Card({ children, className = "", padded = true, ...rest }) {
  return (
    <div className={clsx("card", padded && "p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={clsx("flex items-center justify-between px-5 py-4 border-b border-(--color-border)", className)}>
      <div>
        <h3 className="text-[14.5px] font-bold text-(--color-text-primary)">{title}</h3>
        {subtitle && <p className="text-xs text-(--color-text-secondary) mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
