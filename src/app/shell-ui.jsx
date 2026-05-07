const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

function Brand({ theme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 46,
        height: 46,
        borderRadius: 16,
        background: `linear-gradient(145deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)`,
        border: `1px solid ${theme.lineStrong}`,
        display: "grid",
        placeItems: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 22px rgba(4, 10, 18, 0.12)",
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="21" height="21" rx="6" stroke={theme.ink} strokeOpacity="0.68" />
          <path d="M5.5 16.5H10.2L13 9.7L16 16.5L20.5 11" stroke={theme.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20.5" cy="11" r="2.3" fill={theme.accent} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>NTG</div>
        <div style={{ marginTop: 3, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
          Smart Checkpoints
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, theme, accent }) {
  return (
    <div style={{
      padding: "12px 12px 13px",
      borderRadius: 20,
      background: theme.panelSolid,
      border: `1px solid ${theme.line}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div style={{ marginTop: 7, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 0.95, color: accent || theme.ink }}>
        {value}
      </div>
    </div>
  );
}

function AudienceSwitch({ value, onChange, theme }) {
  const options = [
    { id: "internal", label: "Internal" },
    { id: "customer", label: "Customer" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      padding: 6,
      borderRadius: 22,
      background: theme.surface,
      border: `1px solid ${theme.line}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`ntg-interactive-button${active ? "" : " is-soft"}`}
            style={{
              padding: "10px 12px",
              borderRadius: 16,
              background: active ? theme.panelSolid : "transparent",
              color: active ? theme.ink : theme.inkMuted,
              border: `1px solid ${active ? theme.lineStrong : "transparent"}`,
              boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

NTG.app.shellUi = {
  Brand,
  MiniStat,
  AudienceSwitch,
};
