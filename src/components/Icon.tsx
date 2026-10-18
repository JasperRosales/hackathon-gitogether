export function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    catalogue: "M4 4h16v16H4z M4 9h16 M9 9v11",
    layers: "m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5 M2 16l10 5 10-5",
    settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
    edit: "M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3 M14.5 7.5l2 2",
    arrow: "M5 12h14 m-5-5 5 5-5 5",
    upload: "M12 16V3 m-5 5 5-5 5 5 M4 14v6h16v-6",
    check: "m5 12 4 4L19 6",
    close: "m6 6 12 12 M6 18 18 6",
    trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    swap: "M3 7h17l-4-4 M21 17H4l4 4",
    bag: "M4 7h16l1 14H3Z M8 8V6a4 4 0 0 1 8 0v2",
    clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 6v6l4 2",
    logout: "M9 4H4v16h5 M9 12h12 m-4-4 4 4-4 4",
    search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
    plus: "M12 5v14 M5 12h14",
    sidebar: "M3 4h18v16H3z M9 4v16 M5.5 8h1 M5.5 12h1",
    link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z",
  }
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  )
}

export function Garment({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 80 90" className="garment" aria-hidden="true">
      <path
        fill="currentColor"
        stroke="var(--border-strong)"
        strokeWidth="1"
        d={
          type === "Bottom"
            ? "M23 8h34l5 72H44l-4-48-4 48H18Z"
            : type === "Footwear"
              ? "M10 48h23l7 12 28 7v12H9Z M14 30h23l7 12 24 7v10H13Z"
              : type === "Accessory"
                ? "M18 30h44l5 47H13Z M28 30V20q12-18 24 0v10h-5V20q-7-10-14 0v10Z"
                : type === "Dress"
                  ? "M32 6h16l10 8-4 14 8 38H18l8-38-4-14z M34 6q6 6 12 0"
                  : "m24 12-17 9 8 18 10-5v44h30V34l10 5 8-18-17-9q-16 13-32 0Z"
        }
      />
    </svg>
  )
}
