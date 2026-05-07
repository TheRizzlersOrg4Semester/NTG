const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

function Brand() {
  return (
    <div className="ntg-brand">
      <div className="ntg-brand-mark">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="21" height="21" rx="6" stroke="currentColor" strokeOpacity="0.68" />
          <path d="M5.5 16.5H10.2L13 9.7L16 16.5L20.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="ntg-brand-mark-dot" cx="20.5" cy="11" r="2.3" />
        </svg>
      </div>
      <div>
        <div className="ntg-brand-title">NTG</div>
        <div className="ntg-brand-subtitle">Smart Checkpoints</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "default" }) {
  return (
    <div className="ntg-mini-stat" data-tone={tone}>
      <div className="ntg-mini-stat-label">{label}</div>
      <div className="ntg-mini-stat-value">{value}</div>
    </div>
  );
}

function AudienceSwitch({ value, onChange }) {
  const options = [
    { id: "internal", label: "Internal" },
    { id: "customer", label: "Customer" },
  ];

  return (
    <div className="ntg-audience-switch">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`ntg-audience-button ntg-interactive-button${active ? "" : " is-soft"}`}
            data-active={active ? "true" : "false"}
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
