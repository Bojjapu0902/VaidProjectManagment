const SIZE_MAP = { sm: 28, md: 34, lg: 44 };

export default function Avatar({ initials, size = "md", tone = "portal" }) {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  const toneStyle =
    tone === "portal"
      ? { background: "var(--color-portal-primary-light)", color: "var(--color-portal-primary-on-tint)" }
      : { background: "var(--color-bg)", color: "var(--color-text-secondary)" };

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: px, height: px, fontSize: px * 0.36, ...toneStyle }}
    >
      {initials}
    </div>
  );
}
