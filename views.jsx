// views.jsx — Main app views: list, detail, exceptions, analytics

const { useState, useEffect, useMemo } = React;

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(ts) {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleTimeString("en-DK", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDate(ts) {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("en-DK", { day: "2-digit", month: "short" });
}
function fmtDelta(ts, now) {
  const ms = ts - now;
  const sign = ms >= 0 ? "+" : "−";
  const m = Math.abs(Math.round(ms / 60000));
  if (m < 60) return `${sign}${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${sign}${h}h ${rem.toString().padStart(2, "0")}m`;
}
function statusLabel(s) {
  return ({ "in-transit": "In transit", "delivered": "Delivered", "at-risk": "At risk", "exception": "Exception", "scheduled": "Scheduled" })[s];
}
function statusDot(s, accent) {
  const map = { "in-transit": accent, "delivered": "#0a8a4f", "at-risk": "#d97706", "exception": "#b91c1c", "scheduled": "#9ca3af" };
  return map[s] || accent;
}

// ── ShipmentList ───────────────────────────────────────────────────────────
function ShipmentList({ shipments, onSelect, selectedId, density, accent, ink, paper, now }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    return shipments.filter(s => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      const hay = `${s.id} ${s.customer} ${s.origin} ${s.destination} ${s.plate}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [shipments, q, filter]);

  const rowPadY = density === "compact" ? 8 : density === "comfy" ? 18 : 12;
  const padX = density === "compact" ? 16 : density === "comfy" ? 28 : 22;

  const filters = [
    { id: "all", label: "All", count: shipments.length },
    { id: "in-transit", label: "In transit", count: shipments.filter(s => s.status === "in-transit").length },
    { id: "at-risk", label: "At risk", count: shipments.filter(s => s.status === "at-risk").length },
    { id: "exception", label: "Exception", count: shipments.filter(s => s.status === "exception").length },
    { id: "delivered", label: "Delivered", count: shipments.filter(s => s.status === "delivered").length },
    { id: "scheduled", label: "Scheduled", count: shipments.filter(s => s.status === "scheduled").length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Filter bar */}
      <div style={{ padding: `12px ${padX}px`, borderBottom: `1px solid ${ink}14`, display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shipment, plate, customer…"
            style={{
              width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${ink}1f`,
              background: "transparent", color: ink, fontFamily: "inherit", fontSize: 13, outline: "none",
            }}
          />
          <svg width="14" height="14" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} viewBox="0 0 16 16">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <div style={{ display: "flex", gap: 2, fontSize: 12 }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 10px", border: 0, background: filter === f.id ? ink : "transparent",
                color: filter === f.id ? paper : ink, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, letterSpacing: "0.01em", fontWeight: 500,
              }}
            >
              {f.label} <span style={{ opacity: 0.5, fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "180px 1fr 1.2fr 90px 110px 80px 90px",
        gap: 16, padding: `10px ${padX}px`, fontSize: 10, letterSpacing: "0.08em",
        textTransform: "uppercase", color: `${ink}88`, borderBottom: `1px solid ${ink}14`, flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div>Shipment</div>
        <div>Customer</div>
        <div>Route</div>
        <div>Progress</div>
        <div>Last gate</div>
        <div>ETA</div>
        <div style={{ textAlign: "right" }}>Status</div>
      </div>

      {/* Rows */}
      <div style={{ overflow: "auto", flex: 1 }}>
        {filtered.map((s) => {
          const lastEvt = s.events[s.events.length - 1];
          const lastGate = lastEvt ? window.GATE_BY_ID[lastEvt.gate] : null;
          const sel = s.id === selectedId;
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              style={{
                display: "grid", gridTemplateColumns: "180px 1fr 1.2fr 90px 110px 80px 90px",
                gap: 16, padding: `${rowPadY}px ${padX}px`, alignItems: "center",
                borderBottom: `1px solid ${ink}0c`, cursor: "pointer",
                background: sel ? `${accent}14` : "transparent",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = `${ink}06`; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500 }}>
                {s.id}
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{s.plate}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.customer}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.cargo}</div>
              </div>
              <div style={{ fontSize: 12, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span>{s.origin}</span>
                  <span style={{ opacity: 0.4 }}>→</span>
                  <span style={{ fontWeight: 500 }}>{s.destination}</span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.route.join(" · ")}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, marginBottom: 4 }}>
                  {Math.round(s.progress * 100)}%
                </div>
                <div style={{ height: 3, background: `${ink}14`, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${s.progress * 100}%`, background: statusDot(s.status, accent) }} />
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                {lastGate ? (
                  <>
                    <div style={{ fontWeight: 500 }}>{lastGate.id}</div>
                    <div style={{ opacity: 0.55, fontSize: 10, marginTop: 2 }}>{fmtTime(lastEvt.timestamp)}</div>
                  </>
                ) : <span style={{ opacity: 0.4 }}>—</span>}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                <div>{fmtTime(s.eta)}</div>
                <div style={{ opacity: 0.55, fontSize: 10, marginTop: 2 }}>{fmtDelta(s.eta, now)}</div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot(s.status, accent), display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{statusLabel(s.status)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", opacity: 0.5, fontSize: 13 }}>No shipments match.</div>
        )}
      </div>
    </div>
  );
}

// ── ShipmentDetail ──────────────────────────────────────────────────────────
function ShipmentDetail({ shipment, onClose, accent, ink, paper, now, density, mapVariant, visibleTiers, audienceMode = "internal" }) {
  const padX = density === "compact" ? 18 : density === "comfy" ? 32 : 24;
  if (!shipment) return null;
  const isCustomerView = audienceMode === "customer";
  const route = shipment.route.map(id => window.GATE_BY_ID[id]).filter(Boolean);
  const eventsByGate = Object.fromEntries(shipment.events.map(e => [e.gate, e]));
  const lastEventIdx = shipment.events.length - 1;

  const segments = [];
  for (let i = 0; i < shipment.events.length - 1; i++) {
    const a = new Date(shipment.events[i].timestamp).getTime();
    const b = new Date(shipment.events[i + 1].timestamp).getTime();
    segments.push({ from: shipment.events[i].gate, to: shipment.events[i + 1].gate, dur: b - a });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: `${ink}40`, zIndex: 3000,
      display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.18s",
    }}>
      <div style={{
        width: "min(820px, 92vw)", height: "100%", background: paper, color: ink,
        display: "flex", flexDirection: "column", boxShadow: `-12px 0 60px ${ink}30`,
        animation: "slideIn 0.28s cubic-bezier(.2,.7,.3,1)",
        position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ padding: `20px ${padX}px 18px`, borderBottom: `1px solid ${ink}14`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55, fontFamily: "'JetBrains Mono', monospace" }}>
              {shipment.id}
            </div>
            <h2 style={{ margin: "6px 0 4px", fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: 32, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              {shipment.origin} <span style={{ color: accent, fontStyle: "italic" }}>→</span> {shipment.destination}
            </h2>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{shipment.customer} · {shipment.cargo}</div>
          </div>
          <button onClick={onClose} style={{
            border: `1px solid ${ink}24`, background: "transparent", color: ink, padding: "6px 10px",
            cursor: "pointer", fontFamily: "inherit", fontSize: 12,
          }}>✕  Close</button>
        </div>

        {/* Status strip */}
        <div style={{ padding: `14px ${padX}px`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, borderBottom: `1px solid ${ink}14` }}>
          <Stat label="Status" value={statusLabel(shipment.status)} accent={statusDot(shipment.status, accent)} ink={ink} />
          <Stat label="ETA" value={fmtTime(shipment.eta)} sub={`${fmtDate(shipment.eta)} · ${fmtDelta(shipment.eta, now)}`} ink={ink} />
          {isCustomerView ? (
            <Stat label="Reference" value={shipment.id.replace("NTG-", "")} sub="shipment tracking" ink={ink} mono />
          ) : (
            <Stat label="Plate" value={shipment.plate} sub={shipment.carrier} ink={ink} mono />
          )}
          <Stat label="Weight" value={`${(shipment.weightKg / 1000).toFixed(1)} t`} sub={`${shipment.events.length} of ${shipment.route.length} ${isCustomerView ? "milestones" : "gates"}`} ink={ink} mono />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: `20px ${padX}px 40px` }}>
          {shipment.flags && shipment.flags.length > 0 && (
            <div style={{
              padding: "12px 14px", marginBottom: 22, border: `1px solid ${statusDot(shipment.status, accent)}55`,
              background: `${statusDot(shipment.status, accent)}10`, fontSize: 12, display: "flex", gap: 10, alignItems: "flex-start"
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot(shipment.status, accent), marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Operational flag</div>
                <div style={{ opacity: 0.8 }}>{shipment.flags.join(" · ")}</div>
              </div>
            </div>
          )}

          {/* Mini map */}
          <SectionLabel ink={ink}>Route on network</SectionLabel>
          <div style={{ border: `1px solid ${ink}14`, marginBottom: 28, background: paper }}>
            {mapVariant === "geographic" ? (
              <window.LeafletDenmark
                gates={window.GATES.filter(g => shipment.route.includes(g.id) || g.tier === 1)}
                corridors={[]}
                shipments={[shipment]}
                selectedShipmentId={shipment.id}
                visibleTiers={visibleTiers}
                inkColor={ink} paperColor={paper} accentColor={accent}
                height={280}
                dark={paper !== "#f6f3ec"}
              />
            ) : (
              <window.DenmarkMap
                gates={window.GATES.filter(g => shipment.route.includes(g.id) || g.tier === 1)}
                corridors={[]}
                shipments={[shipment]}
                selectedShipmentId={shipment.id}
                visibleTiers={visibleTiers}
                showLabels={false}
                inkColor={ink} paperColor={paper} accentColor={accent} mutedColor={`${ink}10`}
                height={280}
                variant={mapVariant}
              />
            )}
          </div>

          {/* Timeline */}
          <SectionLabel ink={ink}>{isCustomerView ? "Milestone timeline" : "Gate event timeline"}</SectionLabel>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 1, background: `${ink}1c` }} />
            {route.map((g, i) => {
              const evt = eventsByGate[g.id];
              const fired = !!evt;
              const isLast = i === route.length - 1;
              const isCurrent = i === lastEventIdx && i < route.length - 1;
              const seg = segments.find(s => s.to === g.id);
              return (
                <div key={g.id + i} style={{ position: "relative", paddingBottom: isLast ? 0 : 22 }}>
                  <div style={{
                    position: "absolute", left: -28, top: 2, width: 16, height: 16, borderRadius: "50%",
                    background: fired ? (i === lastEventIdx ? accent : ink) : paper,
                    border: `2px solid ${fired ? (i === lastEventIdx ? accent : ink) : `${ink}30`}`,
                    boxShadow: i === lastEventIdx ? `0 0 0 4px ${accent}22` : "none",
                  }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}>
                        {g.name}
                        {!fired && <span style={{ fontSize: 11, fontStyle: "italic", opacity: 0.5, marginLeft: 8, fontFamily: "inherit" }}>expected</span>}
                        {isCurrent && <span style={{ fontSize: 11, color: accent, marginLeft: 8, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>· current</span>}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {isCustomerView ? g.type : `Tier ${g.tier} · ${g.type}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, minWidth: 140 }}>
                      {fired ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{fmtTime(evt.timestamp)}</div>
                          <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>
                            {fmtDate(evt.timestamp)}{!isCustomerView && ` · conf ${evt.confidence.toFixed(2)}`}
                          </div>
                        </>
                      ) : (
                        <div style={{ opacity: 0.4, fontSize: 11 }}>— awaiting event —</div>
                      )}
                    </div>
                  </div>
                  {seg && i > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, opacity: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                      ↳ leg time: {Math.round(seg.dur / 60000)}m
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, ink, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", letterSpacing: mono ? 0 : "-0.01em" }}>
        {accent && <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />}
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children, ink }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
      {children}
    </div>
  );
}

// ── ExceptionQueue ──────────────────────────────────────────────────────────
function ExceptionQueue({ shipments, onSelect, ink, paper, accent, density, now }) {
  const padX = density === "compact" ? 18 : density === "comfy" ? 32 : 24;
  const flagged = shipments.filter(s => s.status === "exception" || s.status === "at-risk");
  return (
    <div style={{ padding: `24px ${padX}px`, height: "100%", overflow: "auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: 36, letterSpacing: "-0.01em", lineHeight: 1 }}>
            Exceptions
          </h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
            Shipments missing expected gate confirmations or showing operational flags.
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {flagged.length} active
        </div>
      </div>

      {flagged.length === 0 && (
        <div style={{ padding: 80, textAlign: "center", opacity: 0.5, border: `1px dashed ${ink}24` }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontStyle: "italic" }}>All clear.</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>No exceptions detected on the active corridors.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {flagged.map((s) => {
          const sev = s.status === "exception" ? "Severity 1" : "Severity 2";
          const sevColor = statusDot(s.status, accent);
          const lastEvt = s.events[s.events.length - 1];
          const lastGate = lastEvt ? window.GATE_BY_ID[lastEvt.gate] : null;
          return (
            <div key={s.id}
              onClick={() => onSelect(s)}
              style={{
                border: `1px solid ${ink}1c`, padding: "18px 22px", cursor: "pointer", background: paper,
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 22, alignItems: "center",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${ink}06`}
              onMouseLeave={e => e.currentTarget.style.background = paper}
            >
              <div style={{ width: 4, alignSelf: "stretch", background: sevColor }} />
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: sevColor, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{sev}</span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", opacity: 0.5 }}>{s.id}</span>
                </div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, lineHeight: 1.3, marginBottom: 10 }}>
                  {s.flags ? s.flags[0] : "Status flagged"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {s.customer} · {s.origin} <span style={{ opacity: 0.5 }}>→</span> {s.destination}
                  {lastGate && <> · last seen <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lastGate.name}</span> at {fmtTime(lastEvt.timestamp)}</>}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <div>ETA {fmtTime(s.eta)}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{fmtDelta(s.eta, now)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Analytics ───────────────────────────────────────────────────────────────
function Analytics({ shipments, ink, paper, accent, density }) {
  const padX = density === "compact" ? 18 : density === "comfy" ? 32 : 24;
  const total24h = Object.values(window.GATE_VOLUME_24H).reduce((a, b) => a + b, 0);
  const inTransit = shipments.filter(s => s.status === "in-transit").length;
  const onTime = shipments.filter(s => s.status === "in-transit" || s.status === "delivered").length;
  const exceptions = shipments.filter(s => s.status === "exception" || s.status === "at-risk").length;
  const avgConf = (() => {
    const all = shipments.flatMap(s => s.events.map(e => e.confidence));
    return all.length ? (all.reduce((a, b) => a + b, 0) / all.length) : 0;
  })();

  // Top corridor volumes (synthetic)
  const corridorPerf = [
    { name: "Padborg → Copenhagen", events: 312, avgETA: "+2m", reliability: 0.96 },
    { name: "Copenhagen → Malmö", events: 196, avgETA: "−1m", reliability: 0.99 },
    { name: "Aalborg → Hirtshals ferry", events: 88,  avgETA: "+5m", reliability: 0.93 },
    { name: "Hamburg → Aarhus port", events: 152, avgETA: "+3m", reliability: 0.95 },
    { name: "Rødby ferry → Greater CPH", events: 64, avgETA: "+8m", reliability: 0.91 },
  ];

  const gateVolBars = window.GATES
    .map(g => ({ ...g, vol: window.GATE_VOLUME_24H[g.id] || 0 }))
    .sort((a, b) => b.vol - a.vol);
  const maxVol = Math.max(...gateVolBars.map(g => g.vol));

  return (
    <div style={{ padding: `24px ${padX}px`, height: "100%", overflow: "auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: 36, letterSpacing: "-0.01em", lineHeight: 1 }}>
          Network performance
        </h2>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Last 24 hours · all corridors</div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${ink}1c`, marginBottom: 32 }}>
        <KPI label="Gate events" value={total24h.toLocaleString()} sub="across 17 gates" ink={ink} />
        <KPI label="In transit now" value={inTransit} sub={`${shipments.length} total tracked`} ink={ink} accent={accent} divider />
        <KPI label="Exceptions" value={exceptions} sub="requires review" ink={ink} divider />
        <KPI label="Avg confidence" value={avgConf.toFixed(3)} sub="across all events" ink={ink} divider mono />
      </div>

      {/* Corridor table */}
      <SectionLabel ink={ink}>Corridors · 24h</SectionLabel>
      <div style={{ border: `1px solid ${ink}1c`, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr", gap: 16, padding: "10px 18px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: `${ink}88`, borderBottom: `1px solid ${ink}14`, fontFamily: "'JetBrains Mono', monospace" }}>
          <div>Corridor</div>
          <div style={{ textAlign: "right" }}>Events</div>
          <div style={{ textAlign: "right" }}>ETA Δ</div>
          <div>Reliability</div>
        </div>
        {corridorPerf.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr", gap: 16, padding: "12px 18px", borderBottom: i < corridorPerf.length - 1 ? `1px solid ${ink}0c` : 0, alignItems: "center", fontSize: 13 }}>
            <div style={{ fontWeight: 500 }}>{c.name}</div>
            <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{c.events}</div>
            <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: c.avgETA.startsWith("−") ? "#0a8a4f" : ink }}>{c.avgETA}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 4, background: `${ink}10`, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${c.reliability * 100}%`, background: c.reliability > 0.95 ? "#0a8a4f" : c.reliability > 0.93 ? accent : "#d97706" }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, width: 44, textAlign: "right" }}>{(c.reliability * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gate volume bar chart */}
      <SectionLabel ink={ink}>Gate event volume · 24h</SectionLabel>
      <div style={{ border: `1px solid ${ink}1c`, padding: "18px 22px", marginBottom: 32 }}>
        {gateVolBars.map(g => (
          <div key={g.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr 50px", gap: 14, alignItems: "center", padding: "5px 0", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", padding: "1px 5px", border: `1px solid ${ink}24`, opacity: 0.7 }}>T{g.tier}</span>
              <span>{g.name}</span>
            </div>
            <div style={{ height: 8, background: `${ink}08`, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(g.vol / maxVol) * 100}%`, background: g.tier === 1 ? accent : ink, opacity: g.tier === 1 ? 1 : 0.65 }} />
            </div>
            <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{g.vol}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ label, value, sub, ink, accent, divider, mono }) {
  return (
    <div style={{ padding: "20px 22px", borderLeft: divider ? `1px solid ${ink}1c` : "none" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 38, fontFamily: mono ? "'JetBrains Mono', monospace" : "'Instrument Serif', Georgia, serif", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, color: accent || ink }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { ShipmentList, ShipmentDetail, ExceptionQueue, Analytics, fmtTime, fmtDate, fmtDelta, statusLabel, statusDot });
