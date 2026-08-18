// Centralized inline-SVG icon set. No external icon font dependency,
// so the app never breaks due to blocked CDN requests in restrictive
// network environments. Add new icons here and reference by name.

const PATHS = {
  "layout-dashboard": "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  folder: "M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6z",
  folders: "M7 9a1 1 0 0 1 1-1h3l1.5 1.5H19a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9zM3 7V5a1 1 0 0 1 1-1h2.5L8 5.5",
  users: "M9 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 20c0-3 2.5-5 6-5s6 2 6 5M17 9a2.4 2.4 0 1 0 0 4.8M15.5 14.2c2.4.3 4 1.8 4.5 4.2",
  "user-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6.5 19c1-2.5 3-4 5.5-4s4.5 1.5 5.5 4",
  checklist: "M5 6h2M5 12h2M5 18h2M10 6h9M10 12h9M10 18h9M4 6l1 1 1.5-1.5",
  "message-circle": "M4 12a8 8 0 1 1 3 6.2L4 19l1-3.2A7.9 7.9 0 0 1 4 12z",
  "chart-bar": "M4 20V10M10 20V4M16 20v-7M4 20h16",
  bell: "M7 17a5 5 0 0 1 10 0M5 17h14M9 17a3 3 0 0 0 6 0M12 4v2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.1l2-1.5-1.6-2.7-2.3.9a7 7 0 0 0-1.9-1.1L14.7 4h-3l-.4 2.5a7 7 0 0 0-1.9 1.1l-2.3-.9-1.6 2.7 2 1.5A7 7 0 0 0 5 12c0 .4 0 .7.1 1.1l-2 1.5 1.6 2.7 2.3-.9c.6.5 1.2.8 1.9 1.1L9.7 20h3l.4-2.5c.7-.3 1.3-.6 1.9-1.1l2.3.9 1.6-2.7-2-1.5c.1-.4.1-.7.1-1.1z",
  search: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  lock: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3",
  "building-skyscraper": "M5 21V6l7-3 7 3v15M5 21h14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1",
  "building-castle": "M4 21h16M5 21V10l-1-2 3-2 1 2h8l1-2 3 2-1 2v11M9 21v-5h6v5M9 10V7h2v3M13 10V7h2v3",
  "clock-hour": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l4 2",
  "calendar-event": "M4 5h16v15H4zM4 10h16M8 3v4M16 3v4M9 14h0",
  "circle-check": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12.3l2.4 2.3 4.6-5.2",
  "arrow-up-right": "M7 17L17 7M9 7h8v8",
  "arrow-left": "M19 12H5M11 18l-6-6 6-6",
  "alert-triangle": "M12 4l9 16H3zM12 10v4M12 17h.01",
  "file-text": "M7 3h7l4 4v14H7zM14 3v4h4M9 12h6M9 15h6M9 9h2",
  palette: "M12 4a8 8 0 1 0 0 16c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.6 1.7-1.6h1.9A3.7 3.7 0 0 0 20 10.7C20 6.8 16.4 4 12 4zM8.3 12.1a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2zM9.8 8.8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2zM14.2 8.8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2zM16 12.1a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z",
  blueprint: "M4 4h16v16H4zM8 8h8v8H8zM8 12h8M12 8v8",
  photo: "M4 5h16v14H4zM9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 17l4.5-4.5 3 3L17 11l3 3",
  check: "M5 12.5l4.5 4.5L19 7",
  "clipboard-check": "M6 4h12v16H6zM9 4V3h6v1M9.5 13l2 2 3.5-4",
  eye: "M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  download: "M12 4v11M8 11l4 4 4-4M5 19h14",
  upload: "M12 20V9M8 13l4-4 4 4M5 5h14",
  timeline: "M3 12h18M6 13.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM12 13.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM18 13.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z",
  send: "M4 12l16-8-6 16-3-7-7-1z",
  star: "M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z",
  trash: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13",
  edit: "M4 16.8V20h3.2L18 9.2l-3.2-3.2z",
  filter: "M4 5h16M7 12h10M10 19h4",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-right": "M9 6l6 6-6 6",
  "log-out": "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9",
  "dots-vertical": "M12 6a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2zM12 12.6a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2zM12 19.2a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone: "M6 4h3l1 5-2 1.5a10 10 0 0 0 5.5 5.5L15 14l5 1v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 2-2z",
  paperclip: "M21 11.5 12.5 20a4 4 0 0 1-5.7-5.7L15 6a2.7 2.7 0 0 1 3.8 3.8L10.5 18",
  "map-pin": "M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12zM12 11.5a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
};

export default function Icon({ name, size = 18, className = "", strokeWidth = 1.8, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
