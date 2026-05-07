const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

const GLASS_FILTER = "blur(22px) saturate(140%)";

function useTheme(dark) {
  const { useMemo } = React;

  return useMemo(() => dark ? {
    mode: "dark",
    ink: "#f3f7fd",
    inkMuted: "#aab8cb",
    inkSoft: "#7f91a8",
    backdrop: "#07111d",
    paper: "#0c1625",
    panel: "rgba(10, 18, 32, 0.82)",
    panelSolid: "#111d2e",
    surface: "#16263b",
    surfaceAlt: "#1d3048",
    muted: "#273a54",
    accent: "#ddb06a",
    accentStrong: "#f0ca93",
    accentWash: "rgba(221, 176, 106, 0.16)",
    accentGlow: "rgba(221, 176, 106, 0.18)",
    info: "#8bb8ff",
    infoGlow: "rgba(139, 184, 255, 0.16)",
    success: "#63d2a0",
    warning: "#f3a765",
    danger: "#ff867d",
    line: "rgba(181, 196, 217, 0.14)",
    lineStrong: "rgba(181, 196, 217, 0.28)",
    selection: "rgba(221, 176, 106, 0.24)",
    shadow: "0 30px 90px rgba(2, 6, 23, 0.48)",
    softShadow: "0 18px 44px rgba(2, 6, 23, 0.24)",
    glow:
      "radial-gradient(circle at 0% 0%, rgba(221, 176, 106, 0.16), transparent 26%)," +
      "radial-gradient(circle at 100% 0%, rgba(139, 184, 255, 0.14), transparent 28%)," +
      "linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0) 38%)",
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
