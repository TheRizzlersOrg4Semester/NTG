const NTG = window.NTG = window.NTG || {};
NTG.shared = NTG.shared || {};
NTG.shared.ui = NTG.shared.ui || {};

const NTG_GLOBAL_STYLE_ID = "ntg-global-styles";

const NTG_GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { margin: 0; padding: 0; min-height: 100%; }
  html { scrollbar-gutter: stable; }
  body {
    font-family: "Geist", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.005em;
    background: var(--ntg-backdrop);
    color: var(--ntg-ink);
    transition: background 220ms ease, color 220ms ease;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 128px 128px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.34), transparent 72%);
    opacity: 0.2;
  }
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 14%, var(--ntg-accent-glow), transparent 32%),
      radial-gradient(circle at 86% 10%, var(--ntg-info-glow), transparent 30%),
      radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.04), transparent 36%);
    opacity: 0.95;
  }
  button, input, select { font-family: inherit; }
  button { border: 0; }
  input::placeholder { color: inherit; opacity: 0.48; }
  ::selection { background: var(--ntg-selection); color: inherit; }
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(123, 138, 160, 0.35) transparent;
  }
  *::-webkit-scrollbar { width: 10px; height: 10px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb {
    background: rgba(123, 138, 160, 0.35);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  *::-webkit-scrollbar-thumb:hover { background: rgba(123, 138, 160, 0.5); }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { transform: translateX(32px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes riseIn {
    from { transform: translateY(22px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes softPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.18); opacity: 0.55; }
  }

  .pulse-dot,
  .ntg-live-dot { animation: softPulse 1.8s ease-in-out infinite; }
  .ntg-rise-in { animation: riseIn 0.55s both; }
  .ntg-slide-in { animation: slideIn 0.28s ease both; }
  .ntg-fade-in { animation: fadeIn 0.18s ease both; }
  .ntg-scroll { scrollbar-gutter: stable; }

  .ntg-nav-button {
    transition: transform 0.18s cubic-bezier(.2,.7,.3,1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    will-change: transform, background, border-color, box-shadow;
  }
  .ntg-nav-button:hover {
    transform: translateX(4px);
    background: var(--ntg-surface);
    border-color: var(--ntg-line);
  }
  .ntg-nav-button.is-active {
    background: var(--ntg-surface-alt);
    border-color: var(--ntg-line-strong);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 28px rgba(4, 10, 18, 0.08);
  }
  .ntg-nav-button.is-active:hover { transform: none; }

  .ntg-interactive-card,
  .ntg-interactive-button {
    transition: transform 0.18s cubic-bezier(.2,.7,.3,1), border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    will-change: transform, border-color, box-shadow, background;
  }
  .ntg-interactive-card:hover,
  .ntg-interactive-button:hover {
    transform: translateY(-2px);
    border-color: var(--ntg-line-strong) !important;
    box-shadow: 0 18px 36px rgba(4, 10, 18, 0.14) !important;
  }
  .ntg-interactive-card.is-soft:hover,
  .ntg-interactive-button.is-soft:hover {
    background: var(--ntg-surface-alt) !important;
  }

  .ntg-table-row {
    transition: transform 0.16s ease, background 0.16s ease;
    will-change: transform, background;
  }
  .ntg-table-row:hover { transform: translateX(4px); }
  .ntg-table-row:not(.is-selected):hover { background: var(--ntg-surface); }
  .ntg-table-row.is-selected { box-shadow: inset 4px 0 0 var(--ntg-accent); }
  .ntg-table-row.is-selected:hover { transform: none; }

  .ntg-toast {
    animation: slideIn 0.28s cubic-bezier(.2,.7,.3,1) both;
  }

  .leaflet-container { background: transparent !important; font-family: "Geist", sans-serif !important; }
  .leaflet-tooltip.ntg-tip {
    background: #101820;
    color: #f4f7fb;
    border: 0;
    border-radius: 14px;
    padding: 7px 11px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.22);
    font-family: "Geist", sans-serif;
  }
  .leaflet-tooltip.ntg-tip::before { border-top-color: #101820 !important; }
  .leaflet-control-zoom a {
    background: rgba(248, 251, 255, 0.92) !important;
    color: #102033 !important;
    border: 0 !important;
    font-family: "Geist", sans-serif !important;
    box-shadow: 0 8px 18px rgba(16, 32, 51, 0.12);
  }
`;

function ensureGlobalStyles() {
  if (document.getElementById(NTG_GLOBAL_STYLE_ID)) return;
  const styleTag = document.createElement("style");
  styleTag.id = NTG_GLOBAL_STYLE_ID;
  styleTag.textContent = NTG_GLOBAL_STYLES;
  document.head.appendChild(styleTag);
}

ensureGlobalStyles();

NTG.shared.ui.ensureGlobalStyles = ensureGlobalStyles;
