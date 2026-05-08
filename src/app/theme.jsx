const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

const GLASS_FILTER = "blur(22px) saturate(140%)";

function useTheme(dark) {
  const { useMemo } = React;

  return useMemo(() => dark ? {
    mode: "dark",
    ink: "#e8eef7",
    inkMuted: "#8d9caf",
    inkSoft: "#617085",
    backdrop: "#07101a",
    paper: "#0a121d",
    panel: "#0f1a29",
    panelSolid: "#0f1a29",
    surface: "#132235",
    surfaceAlt: "#17283d",
    muted: "#223348",
    accent: "#60a5fa",
    accentStrong: "#93c5fd",
    accentWash: "rgba(96, 165, 250, 0.12)",
    accentGlow: "rgba(96, 165, 250, 0.08)",
    info: "#60a5fa",
    infoGlow: "rgba(96, 165, 250, 0.08)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    line: "rgba(148, 163, 184, 0.16)",
    lineStrong: "rgba(148, 163, 184, 0.28)",
    selection: "rgba(96, 165, 250, 0.24)",
    shadow: "none",
    softShadow: "none",
    glow: "none",
  } : {
    mode: "light",
    ink: "#15263a",
    inkMuted: "#60738a",
    inkSoft: "#8fa0b4",
    backdrop: "#eef3f8",
    paper: "#fbfdff",
    panel: "rgba(255, 255, 255, 0.8)",
    panelSolid: "#ffffff",
    surface: "#f3f7fb",
    surfaceAlt: "#e6edf5",
    muted: "#d8e1ec",
    accent: "#ba7d3b",
    accentStrong: "#d79a5a",
    accentWash: "rgba(186, 125, 59, 0.10)",
    accentGlow: "rgba(186, 125, 59, 0.14)",
    info: "#467cc2",
    infoGlow: "rgba(70, 124, 194, 0.12)",
    success: "#2f8f66",
    warning: "#bf722b",
    danger: "#bf5047",
    line: "rgba(21, 38, 58, 0.10)",
    lineStrong: "rgba(21, 38, 58, 0.18)",
    selection: "rgba(186, 125, 59, 0.18)",
    shadow: "0 28px 74px rgba(76, 93, 118, 0.16)",
    softShadow: "0 14px 34px rgba(76, 93, 118, 0.10)",
    glow:
      "radial-gradient(circle at 0% 0%, rgba(186, 125, 59, 0.10), transparent 28%)," +
      "radial-gradient(circle at 100% 0%, rgba(70, 124, 194, 0.10), transparent 30%)," +
      "linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(238, 243, 248, 0.98) 36%)",
  }, [dark]);
}

function cardStyle(theme, options = {}) {
  return {
    background: options.background || theme.panel,
    border: `1px solid ${options.borderColor || theme.line}`,
    borderRadius: options.radius || 28,
    boxShadow: options.shadow === undefined ? theme.softShadow : options.shadow,
    backdropFilter: GLASS_FILTER,
    WebkitBackdropFilter: GLASS_FILTER,
    position: options.position,
    ...options.style,
  };
}

function syncThemeDocument(theme) {
  const root = document.documentElement;
  const vars = {
    "--ntg-backdrop": theme.backdrop,
    "--ntg-ink": theme.ink,
    "--ntg-ink-muted": theme.inkMuted,
    "--ntg-ink-soft": theme.inkSoft,
    "--ntg-paper": theme.paper,
    "--ntg-panel": theme.panel,
    "--ntg-panel-solid": theme.panelSolid,
    "--ntg-surface": theme.surface,
    "--ntg-surface-alt": theme.surfaceAlt,
    "--ntg-muted": theme.muted,
    "--ntg-line": theme.line,
    "--ntg-line-strong": theme.lineStrong,
    "--ntg-accent": theme.accent,
    "--ntg-accent-strong": theme.accentStrong,
    "--ntg-accent-wash": theme.accentWash,
    "--ntg-selection": theme.selection,
    "--ntg-accent-glow": theme.accentGlow,
    "--ntg-info": theme.info,
    "--ntg-info-glow": theme.infoGlow,
    "--ntg-success": theme.success,
    "--ntg-warning": theme.warning,
    "--ntg-danger": theme.danger,
    "--ntg-shadow": theme.shadow,
    "--ntg-soft-shadow": theme.softShadow,
    "--ntg-glow": theme.glow,
    "--ntg-glass-filter": GLASS_FILTER,
  };

  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.style.colorScheme = theme.mode;
  document.body.style.background = theme.backdrop;
  document.body.style.color = theme.ink;
}

NTG.app.theme = {
  GLASS_FILTER,
  useTheme,
  cardStyle,
  syncThemeDocument,
};
