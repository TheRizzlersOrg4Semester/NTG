const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

function HeroChip({ label, value }) {
  return (
    <div className="ntg-hero-chip">
      <div className="ntg-hero-chip-label">{label}</div>
      <div className="ntg-hero-chip-value">{value}</div>
    </div>
  );
}

function HeroMetric({ label, value, sub, tone, mono }) {
  return (
    <div className="ntg-hero-metric" data-tone={tone} data-mono={mono ? "true" : "false"}>
      <div className="ntg-hero-metric-header">
        <span className="ntg-hero-metric-label">{label}</span>
        <span className="ntg-hero-metric-dot" />
      </div>
      <div className="ntg-hero-metric-value">{value}</div>
      <div className="ntg-hero-metric-sub">{sub}</div>
    </div>
  );
}

function BigKPI({ label, value, note, tone, delay = 0 }) {
  return (
    <div className="ntg-panel ntg-big-kpi" data-tone={tone} data-delay={String(Math.round(delay * 100))}>
      <div className="ntg-big-kpi-header">
        <div className="ntg-big-kpi-label">{label}</div>
        <span className="ntg-big-kpi-dot" />
      </div>
      <div className="ntg-big-kpi-value">{value}</div>
      <div className="ntg-big-kpi-note">{note}</div>
    </div>
  );
}

function MapBadge({ label, accent = false }) {
  return (
    <div className="ntg-map-badge" data-accent={accent ? "true" : "false"}>
      {label}
    </div>
  );
}

function SignalTile({ label, value, sub, tone = "default" }) {
  return (
    <div className="ntg-signal-tile" data-tone={tone}>
      <div className="ntg-signal-label">{label}</div>
      <div className="ntg-signal-value">{value}</div>
      <div className="ntg-signal-sub">{sub}</div>
    </div>
  );
}

function Thesis({ n, title, body }) {
  return (
    <div className="ntg-panel ntg-thesis">
      <div className="ntg-thesis-number">{n}</div>
      <h3 className="ntg-thesis-title">{title}</h3>
      <p className="ntg-copy ntg-thesis-body">{body}</p>
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
