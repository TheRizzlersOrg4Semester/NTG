const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

const { cardStyle } = NTG.app.theme;

function HeroChip({ label, value, theme }) {
  return (
    <div style={{
      padding: "11px 14px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${theme.line}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

function HeroMetric({ label, value, sub, theme, tone, mono }) {
  return (
    <div style={{
      padding: "14px 15px",
      borderRadius: 20,
      background: theme.surface,
      border: `1px solid ${theme.line}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone, display: "inline-block" }} />
      </div>
      <div style={{
        marginTop: 8,
        fontSize: mono ? 18 : 26,
        fontWeight: mono ? 600 : 500,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        letterSpacing: mono ? 0 : "-0.02em",
      }}>
        {value}
      </div>
      <div style={{ marginTop: 7, fontSize: 11, color: theme.inkMuted, lineHeight: 1.5 }}>
        {sub}
      </div>
    </div>
  );
}

function BigKPI({ label, value, note, theme, tone, delay = 0 }) {
  return (
    <div style={{
      ...cardStyle(theme, { background: theme.panel, radius: 28 }),
      padding: "20px 20px 22px",
      animation: `riseIn 0.55s ${delay}s both`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </div>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: tone, display: "inline-block" }} />
      </div>
      <div style={{ marginTop: 14, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 54, lineHeight: 0.92, letterSpacing: "-0.05em" }}>
        {value}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: theme.inkMuted, lineHeight: 1.55 }}>
        {note}
      </div>
    </div>
  );
}

function MapBadge({ label, theme, accent = false }) {
  return (
    <div style={{
      padding: "8px 10px",
      borderRadius: 999,
      background: accent ? theme.accentWash : theme.surface,
      color: accent ? theme.accent : theme.inkMuted,
      border: `1px solid ${theme.line}`,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {label}
    </div>
  );
}

function SignalTile({ label, value, sub, theme, accent }) {
  return (
    <div style={{
      padding: "14px 15px",
      borderRadius: 22,
      background: theme.surface,
      border: `1px solid ${theme.line}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, lineHeight: 0.96, color: accent || theme.ink }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: theme.inkMuted, lineHeight: 1.5 }}>
        {sub}
      </div>
    </div>
  );
}

function Thesis({ n, title, body, theme }) {
  return (
    <div style={{
      ...cardStyle(theme, { background: theme.panel, radius: 28 }),
      padding: "20px 20px 22px",
    }}>
      <div style={{ fontSize: 11, color: theme.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.14em" }}>
        {n}
      </div>
      <h3 style={{ margin: "14px 0 0", fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: 28, lineHeight: 1, letterSpacing: "-0.03em" }}>
        {title}
      </h3>
      <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.68, color: theme.inkMuted }}>
        {body}
      </p>
    </div>
  );
}

NTG.features.dashboard.ui = {
  HeroChip,
  HeroMetric,
  BigKPI,
  MapBadge,
  SignalTile,
  Thesis,
};
