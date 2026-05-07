const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.shipments = NTG.features.shipments || {};

const { useState, useMemo, useDeferredValue } = React;
const { fmtTime, fmtDate, fmtDelta, statusLabel, statusDot } = NTG.shared.utils.formatters;
const shipmentData = NTG.domain.shipments.data;
const { DenmarkMap, LeafletDenmark } = NTG.features.maps;

const VIEW_GLASS_FILTER = "blur(22px) saturate(140%)";

function panelStyle(theme, options = {}) {
  return {
    background: options.background || theme.panel,
    border: `1px solid ${options.borderColor || theme.line}`,
    borderRadius: options.radius || 28,
    boxShadow: options.shadow === undefined ? theme.softShadow : options.shadow,
    backdropFilter: VIEW_GLASS_FILTER,
    WebkitBackdropFilter: VIEW_GLASS_FILTER,
    ...options.style,
  };
}

function titleStyle(size = 36) {
  return {
    margin: 0,
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontWeight: 400,
    fontSize: size,
    lineHeight: 0.98,
    letterSpacing: "-0.03em",
  };
}

function bodyCopy(theme) {
  return { fontSize: 13, lineHeight: 1.68, color: theme.inkMuted };
}

function smallLabel(theme) {
  return {
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: theme.inkMuted,
    fontFamily: "'JetBrains Mono', monospace",
  };
}

function softInputStyle(theme) {
  return {
    width: "100%",
    padding: "13px 14px 13px 38px",
    borderRadius: 18,
    border: `1px solid ${theme.line}`,
    background: theme.surface,
    color: theme.ink,
    outline: "none",
    fontSize: 13,
  };
}

function ShipmentList({ shipments, onSelect, selectedId, density, accent, ink, paper, now, theme, layout }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const deferredQuery = useDeferredValue(q);
  const filtered = useMemo(() => {
    return shipments.filter((shipment) => {
      if (filter !== "all" && shipment.status !== filter) return false;
      if (!deferredQuery) return true;
      const haystack = `${shipment.id} ${shipment.customer} ${shipment.origin} ${shipment.destination} ${shipment.plate}`.toLowerCase();
      return haystack.includes(deferredQuery.toLowerCase());
    });
  }, [shipments, deferredQuery, filter]);

  const pad = density === "compact" ? 18 : density === "comfy" ? 28 : 22;
  const filters = [
    { id: "all", label: "All", count: shipments.length },
    { id: "in-transit", label: "In transit", count: shipments.filter((s) => s.status === "in-transit").length },
    { id: "at-risk", label: "At risk", count: shipments.filter((s) => s.status === "at-risk").length },
    { id: "exception", label: "Exception", count: shipments.filter((s) => s.status === "exception").length },
    { id: "delivered", label: "Delivered", count: shipments.filter((s) => s.status === "delivered").length },
    { id: "scheduled", label: "Scheduled", count: shipments.filter((s) => s.status === "scheduled").length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
      <section style={{
        ...panelStyle(theme, {
          background: `linear-gradient(135deg, ${theme.panelSolid} 0%, ${theme.surfaceAlt} 100%)`,
          radius: 32,
          shadow: theme.shadow,
        }),
        padding: layout.isNarrow ? 22 : 28,
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          right: -60,
          top: -70,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.accentWash} 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: layout.isNarrow ? "1fr" : "minmax(0, 1.2fr) 280px",
          gap: 18,
          alignItems: "end",
        }}>
          <div>
            <div style={smallLabel(theme)}>Operations workspace</div>
            <h2 style={{ ...titleStyle(layout.isNarrow ? 40 : 48), marginTop: 14 }}>Shipment command</h2>
            <p style={{ ...bodyCopy(theme), margin: "14px 0 0", maxWidth: 620 }}>
              A cleaner table for searching, filtering, and opening the live narrative behind each tracked shipment.
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}>
            <InsightCard label="Tracked" value={shipments.length} theme={theme} />
            <InsightCard label="Moving" value={shipments.filter((s) => s.status === "in-transit").length} theme={theme} accent={theme.info} />
          </div>
        </div>
      </section>

      <section style={{
        ...panelStyle(theme, { background: theme.panel, radius: 28 }),
        padding: pad,
        display: "grid",
        gridTemplateColumns: layout.isNarrow ? "1fr" : "minmax(260px, 360px) minmax(0, 1fr)",
        gap: 16,
        alignItems: "start",
      }}>
        <div style={{ position: "relative" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shipment, customer, plate..."
            style={softInputStyle(theme)}
          />
          <svg width="15" height="15" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.inkMuted }} viewBox="0 0 16 16">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {filters.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: active ? theme.surfaceAlt : theme.surface,
                  color: active ? theme.ink : theme.inkMuted,
                  border: `1px solid ${active ? theme.lineStrong : theme.line}`,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{option.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: active ? theme.accent : theme.inkSoft }}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{
        ...panelStyle(theme, { background: theme.panel, radius: 30 }),
        padding: 0,
        overflow: "hidden",
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{ overflowX: "auto", minHeight: "100%" }}>
          <div style={{ minWidth: layout.isNarrow ? 880 : 980 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "190px 1fr 1.2fr 110px 120px 96px 110px",
              gap: 16,
              padding: "16px 22px",
              borderBottom: `1px solid ${theme.line}`,
              background: theme.surface,
              ...smallLabel(theme),
            }}>
              <div>Shipment</div>
              <div>Customer</div>
              <div>Route</div>
              <div>Progress</div>
              <div>Last gate</div>
              <div>ETA</div>
              <div style={{ textAlign: "right" }}>Status</div>
            </div>

            {filtered.map((shipment) => {
              const lastEvent = shipment.events[shipment.events.length - 1];
              const lastGate = lastEvent ? shipmentData.GATE_BY_ID[lastEvent.gate] : null;
              const selected = shipment.id === selectedId;
              const pillColor = statusDot(shipment.status, accent);

              return (
                <div
                  key={shipment.id}
                  onClick={() => onSelect(shipment)}
                  className={`ntg-table-row${selected ? " is-selected" : ""}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "190px 1fr 1.2fr 110px 120px 96px 110px",
                    gap: 16,
                    padding: "16px 22px",
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: `1px solid ${theme.line}`,
                    background: selected ? theme.accentWash : "transparent",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600 }}>{shipment.id}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: theme.inkMuted }}>{shipment.plate}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shipment.customer}</div>
                    <div style={{ marginTop: 5, fontSize: 11, color: theme.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {shipment.cargo}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span>{shipment.origin}</span>
                      <span style={{ color: theme.inkSoft }}>-></span>
                      <span style={{ fontWeight: 600 }}>{shipment.destination}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: theme.inkSoft, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {shipment.route.join(" / ")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, marginBottom: 6 }}>{Math.round(shipment.progress * 100)}%</div>
                    <div style={{ height: 6, borderRadius: 999, background: theme.surface }}>
                      <div style={{
                        width: `${shipment.progress * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: pillColor,
                      }} />
                    </div>
                  </div>

                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {lastGate ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{lastGate.id}</div>
                        <div style={{ marginTop: 4, color: theme.inkMuted }}>{fmtTime(lastEvent.timestamp)}</div>
                      </>
                    ) : (
                      <span style={{ color: theme.inkSoft }}>Awaiting</span>
                    )}
                  </div>

                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    <div>{fmtTime(shipment.eta)}</div>
                    <div style={{ marginTop: 4, color: theme.inkMuted }}>{fmtDelta(shipment.eta, now)}</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{
                      padding: "8px 10px",
                      borderRadius: 999,
                      background: `${pillColor}18`,
                      color: pillColor,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {statusLabel(shipment.status)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: 68, textAlign: "center", color: theme.inkMuted }}>
                No shipments match the current search and filters.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ShipmentDetail({ shipment, onClose, accent, ink, paper, now, density, mapVariant, visibleTiers, audienceMode = "internal", theme, layout }) {
  const pad = density === "compact" ? 18 : density === "comfy" ? 28 : 22;
  if (!shipment) return null;

  const isCustomerView = audienceMode === "customer";
  const detailMapVariant = mapVariant === "europe-network" ? "geographic" : mapVariant;
  const route = shipment.route.map((id) => shipmentData.GATE_BY_ID[id]).filter(Boolean);
  const eventsByGate = Object.fromEntries(shipment.events.map((event) => [event.gate, event]));
  const lastEventIndex = shipment.events.length - 1;
  const lastEvent = shipment.events[lastEventIndex];
  const lastGate = lastEvent ? shipmentData.GATE_BY_ID[lastEvent.gate] : null;
  const nextGate = shipment.route[shipment.events.length] ? shipmentData.GATE_BY_ID[shipment.route[shipment.events.length]] : null;

  const segments = [];
  for (let i = 0; i < shipment.events.length - 1; i += 1) {
    const start = new Date(shipment.events[i].timestamp).getTime();
    const end = new Date(shipment.events[i + 1].timestamp).getTime();
    segments.push({ from: shipment.events[i].gate, to: shipment.events[i + 1].gate, duration: end - start });
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(2, 6, 23, 0.56)",
      zIndex: 3000,
      display: "flex",
      justifyContent: "flex-end",
      animation: "fadeIn 0.18s ease both",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}>
      <div style={{
        width: "min(920px, 96vw)",
        height: "100%",
        background: theme.paper,
        color: theme.ink,
        boxShadow: `-18px 0 72px rgba(2, 6, 23, 0.36)`,
        animation: "slideIn 0.28s cubic-bezier(.2,.7,.3,1) both",
        overflow: "auto",
      }}>
        <div style={{ padding: pad }}>
          <div style={{
            ...panelStyle(theme, {
              background: `linear-gradient(135deg, ${theme.panelSolid} 0%, ${theme.surfaceAlt} 100%)`,
              radius: 30,
              shadow: "none",
            }),
            padding: layout.isNarrow ? 20 : 24,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              right: -40,
              top: -50,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accentWash} 0%, transparent 70%)`,
            }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={smallLabel(theme)}>{shipment.id}</div>
                <h2 style={{ ...titleStyle(layout.isNarrow ? 38 : 48), marginTop: 14 }}>
                  {shipment.origin} <span style={{ color: accent }}>-></span> {shipment.destination}
                </h2>
                <div style={{ marginTop: 10, fontSize: 14, color: theme.inkMuted }}>
                  {shipment.customer} / {shipment.cargo}
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  padding: "11px 14px",
                  borderRadius: 16,
                  background: theme.surface,
                  color: theme.ink,
                  border: `1px solid ${theme.line}`,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: layout.isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
            gap: 12,
            marginTop: 16,
          }}>
            <Stat label="Status" value={statusLabel(shipment.status)} accent={statusDot(shipment.status, accent)} theme={theme} />
            <Stat label="ETA" value={fmtTime(shipment.eta)} sub={`${fmtDate(shipment.eta)} / ${fmtDelta(shipment.eta, now)}`} theme={theme} />
            {isCustomerView ? (
              <Stat label="Reference" value={shipment.id.replace("NTG-", "")} sub="Shipment tracking reference" theme={theme} mono />
            ) : (
              <Stat label="Vehicle" value={shipment.plate} sub={shipment.carrier} theme={theme} mono />
            )}
            <Stat label="Weight" value={`${(shipment.weightKg / 1000).toFixed(1)} t`} sub={`${shipment.events.length} of ${shipment.route.length} milestones confirmed`} theme={theme} mono />
          </div>

          {shipment.flags && shipment.flags.length > 0 && (
            <div style={{
              ...panelStyle(theme, {
                background: `${statusDot(shipment.status, accent)}14`,
                borderColor: `${statusDot(shipment.status, accent)}44`,
                radius: 24,
                shadow: "none",
              }),
              padding: "16px 18px",
              marginTop: 16,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusDot(shipment.status, accent), display: "inline-block", marginTop: 6 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Operational flag</div>
                <div style={{ color: theme.inkMuted, fontSize: 13, lineHeight: 1.6 }}>{shipment.flags.join(" / ")}</div>
              </div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: layout.isTablet ? "1fr" : "minmax(0, 1.15fr) 320px",
            gap: 16,
            marginTop: 16,
          }}>
            <div style={{
              ...panelStyle(theme, { background: theme.panel, radius: 28 }),
              padding: pad,
              overflow: "hidden",
            }}>
              <SectionLabel theme={theme}>Route on network</SectionLabel>
              {mapVariant === "europe-network" && (
                <div style={{ marginBottom: 12, fontSize: 11, lineHeight: 1.55, color: theme.inkMuted }}>
                  Shipment detail stays on the Denmark route map so checkpoint-level progress remains precise.
                </div>
              )}
              <div style={{
                borderRadius: 24,
                overflow: "hidden",
                border: `1px solid ${theme.line}`,
                background: theme.paper,
              }}>
                {detailMapVariant === "geographic" ? (
                  <LeafletDenmark
                    gates={shipmentData.GATES.filter((gate) => shipment.route.includes(gate.id) || gate.tier === 1)}
                    corridors={[]}
                    shipments={[shipment]}
                    selectedShipmentId={shipment.id}
                    visibleTiers={visibleTiers}
                    inkColor={ink}
                    paperColor={paper}
                    accentColor={accent}
                    height={300}
                    dark={theme.mode === "dark"}
                  />
                ) : (
                  <DenmarkMap
                    gates={shipmentData.GATES.filter((gate) => shipment.route.includes(gate.id) || gate.tier === 1)}
                    corridors={[]}
                    shipments={[shipment]}
                    selectedShipmentId={shipment.id}
                    visibleTiers={visibleTiers}
                    showLabels={false}
                    inkColor={ink}
                    paperColor={paper}
                    accentColor={accent}
                    mutedColor={theme.muted}
                    height={300}
                    variant={detailMapVariant}
                  />
                )}
              </div>
            </div>

            <div style={{
              ...panelStyle(theme, { background: theme.panel, radius: 28 }),
              padding: pad,
              display: "grid",
              gap: 12,
              alignContent: "start",
            }}>
              <SectionLabel theme={theme}>Routing brief</SectionLabel>
              <DetailLine label="Last confirmed" value={lastGate ? `${lastGate.name} at ${fmtTime(lastEvent.timestamp)}` : "Awaiting first checkpoint"} theme={theme} />
              <DetailLine label="Next expected" value={nextGate ? nextGate.name : "Final milestone reached"} theme={theme} accent={nextGate ? theme.info : theme.success} />
              <DetailLine label={isCustomerView ? "Milestones" : "Checkpoints"} value={`${shipment.events.length} confirmed of ${shipment.route.length}`} theme={theme} />
              <DetailLine label="Customer" value={shipment.customer} theme={theme} />
              {!isCustomerView && <DetailLine label="Carrier" value={shipment.carrier} theme={theme} />}
            </div>
          </div>

          <div style={{
            ...panelStyle(theme, { background: theme.panel, radius: 28 }),
            padding: pad,
            marginTop: 16,
          }}>
            <SectionLabel theme={theme}>{isCustomerView ? "Milestone timeline" : "Gate event timeline"}</SectionLabel>
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 1, background: theme.lineStrong }} />
              {route.map((gate, index) => {
                const event = eventsByGate[gate.id];
                const fired = !!event;
                const isLast = index === route.length - 1;
                const isCurrent = index === lastEventIndex && index < route.length - 1;
                const segment = segments.find((item) => item.to === gate.id);
                const markerColor = fired ? (index === lastEventIndex ? accent : theme.ink) : theme.paper;

                return (
                  <div key={`${gate.id}-${index}`} style={{ position: "relative", paddingBottom: isLast ? 0 : 22 }}>
                    <div style={{
                      position: "absolute",
                      left: -28,
                      top: 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: markerColor,
                      border: `2px solid ${fired ? markerColor : theme.lineStrong}`,
                      boxShadow: index === lastEventIndex ? `0 0 0 5px ${theme.accentWash}` : "none",
                    }} />

                    <div style={{
                      ...panelStyle(theme, {
                        background: fired ? theme.surface : theme.panelSolid,
                        radius: 22,
                        shadow: "none",
                      }),
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1, letterSpacing: "-0.03em" }}>
                            {gate.name}
                            {!fired && <span style={{ marginLeft: 8, fontSize: 12, color: theme.inkMuted, fontFamily: "inherit", fontStyle: "italic" }}>expected</span>}
                            {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>current</span>}
                          </div>
                          <div style={{ marginTop: 5, ...smallLabel(theme) }}>
                            {isCustomerView ? gate.type : `Tier ${gate.tier} / ${gate.type}`}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                          {fired ? (
                            <>
                              <div style={{ fontWeight: 600 }}>{fmtTime(event.timestamp)}</div>
                              <div style={{ marginTop: 4, color: theme.inkMuted, fontSize: 10 }}>
                                {fmtDate(event.timestamp)}{!isCustomerView && ` / conf ${event.confidence.toFixed(2)}`}
                              </div>
                            </>
                          ) : (
                            <div style={{ color: theme.inkSoft, fontSize: 11 }}>Awaiting event</div>
                          )}
                        </div>
                      </div>

                      {segment && index > 0 && (
                        <div style={{ marginTop: 8, color: theme.inkMuted, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                          leg time {Math.round(segment.duration / 60000)}m
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, theme, mono }) {
  return (
    <div style={{
      ...panelStyle(theme, { background: theme.panel, radius: 24, shadow: "none" }),
      padding: "16px 18px",
    }}>
      <div style={smallLabel(theme)}>{label}</div>
      <div style={{
        marginTop: 9,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 18,
        fontWeight: 600,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        letterSpacing: mono ? 0 : "-0.02em",
      }}>
        {accent && <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, display: "inline-block" }} />}
        {value}
      </div>
      {sub && <div style={{ marginTop: 7, fontSize: 11, color: theme.inkMuted, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children, theme }) {
  return <div style={{ ...smallLabel(theme), marginBottom: 12 }}>{children}</div>;
}

function DetailLine({ label, value, theme, accent }) {
  return (
    <div style={{
      padding: "14px 15px",
      borderRadius: 20,
      background: theme.surface,
      border: `1px solid ${theme.line}`,
    }}>
      <div style={smallLabel(theme)}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: accent || theme.ink, lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

function ExceptionQueue({ shipments, onSelect, ink, paper, accent, density, now, theme, layout }) {
  const pad = density === "compact" ? 18 : density === "comfy" ? 28 : 22;
  const flagged = shipments.filter((shipment) => shipment.status === "exception" || shipment.status === "at-risk");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{
        ...panelStyle(theme, {
          background: `linear-gradient(135deg, ${theme.panelSolid} 0%, ${theme.surfaceAlt} 100%)`,
          radius: 32,
          shadow: theme.shadow,
        }),
        padding: layout.isNarrow ? 22 : 28,
      }}>
        <div style={smallLabel(theme)}>Operational watchlist</div>
        <h2 style={{ ...titleStyle(layout.isNarrow ? 40 : 48), marginTop: 14 }}>Exceptions</h2>
        <p style={{ ...bodyCopy(theme), margin: "14px 0 0", maxWidth: 620 }}>
          Shipments missing expected milestone confirmations or carrying operational flags that deserve human attention.
        </p>
      </section>

      {flagged.length === 0 && (
        <div style={{
          ...panelStyle(theme, { background: theme.panel, radius: 28 }),
          padding: 68,
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1 }}>All clear.</div>
          <div style={{ marginTop: 10, color: theme.inkMuted, fontSize: 13 }}>
            No active exceptions on the visible corridors.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {flagged.map((shipment) => {
          const severity = shipment.status === "exception" ? "Severity 1" : "Severity 2";
          const severityColor = statusDot(shipment.status, accent);
          const lastEvent = shipment.events[shipment.events.length - 1];
          const lastGate = lastEvent ? shipmentData.GATE_BY_ID[lastEvent.gate] : null;

          return (
            <button
              key={shipment.id}
              onClick={() => onSelect(shipment)}
              className="ntg-interactive-card"
              style={{
                ...panelStyle(theme, { background: theme.panel, radius: 28 }),
                padding: "18px 20px",
                cursor: "pointer",
                textAlign: "left",
                display: "grid",
                gridTemplateColumns: layout.isNarrow ? "1fr" : "6px minmax(0, 1fr) auto",
                gap: layout.isNarrow ? 14 : 18,
                alignItems: "center",
              }}
            >
              {!layout.isNarrow && <div style={{ alignSelf: "stretch", borderRadius: 999, background: severityColor }} />}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ ...smallLabel(theme), color: severityColor }}>{severity}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: theme.inkSoft }}>{shipment.id}</span>
                </div>
                <div style={{ marginTop: 10, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
                  {shipment.flags ? shipment.flags[0] : "Status flagged"}
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: theme.inkMuted, lineHeight: 1.65 }}>
                  {shipment.customer} / {shipment.origin} -> {shipment.destination}
                  {lastGate && <> / last seen {lastGate.name} at {fmtTime(lastEvent.timestamp)}</>}
                </div>
              </div>
              <div style={{ textAlign: layout.isNarrow ? "left" : "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <div>ETA {fmtTime(shipment.eta)}</div>
                <div style={{ marginTop: 5, color: theme.inkMuted }}>{fmtDelta(shipment.eta, now)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Analytics({ shipments, ink, paper, accent, density, theme, layout }) {
  const pad = density === "compact" ? 18 : density === "comfy" ? 28 : 22;
  const total24h = Object.values(shipmentData.GATE_VOLUME_24H).reduce((sum, value) => sum + value, 0);
  const inTransit = shipments.filter((shipment) => shipment.status === "in-transit").length;
  const onTime = shipments.filter((shipment) => shipment.status === "in-transit" || shipment.status === "delivered").length;
  const exceptions = shipments.filter((shipment) => shipment.status === "exception" || shipment.status === "at-risk").length;
  const avgConfidence = (() => {
    const all = shipments.flatMap((shipment) => shipment.events.map((event) => event.confidence));
    return all.length ? all.reduce((sum, value) => sum + value, 0) / all.length : 0;
  })();

  const corridorPerformance = [
    { name: "Padborg -> Copenhagen", events: 312, avgEta: "+2m", reliability: 0.96 },
    { name: "Copenhagen -> Malmo", events: 196, avgEta: "-1m", reliability: 0.99 },
    { name: "Aalborg -> Hirtshals ferry", events: 88, avgEta: "+5m", reliability: 0.93 },
    { name: "Hamburg -> Aarhus port", events: 152, avgEta: "+3m", reliability: 0.95 },
    { name: "Rodby ferry -> Greater Copenhagen", events: 64, avgEta: "+8m", reliability: 0.91 },
  ];

  const gateVolumes = shipmentData.GATES
    .map((gate) => ({ ...gate, vol: shipmentData.GATE_VOLUME_24H[gate.id] || 0 }))
    .sort((a, b) => b.vol - a.vol);
  const maxVolume = Math.max(...gateVolumes.map((gate) => gate.vol));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{
        ...panelStyle(theme, {
          background: `linear-gradient(135deg, ${theme.panelSolid} 0%, ${theme.surfaceAlt} 100%)`,
          radius: 32,
          shadow: theme.shadow,
        }),
        padding: layout.isNarrow ? 22 : 28,
      }}>
        <div style={smallLabel(theme)}>Pilot intelligence</div>
        <h2 style={{ ...titleStyle(layout.isNarrow ? 40 : 48), marginTop: 14 }}>Network performance</h2>
        <p style={{ ...bodyCopy(theme), margin: "14px 0 0", maxWidth: 620 }}>
          A cleaner analytical layer over the synthetic pilot data, tuned for leadership readouts and operational reviews.
        </p>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: layout.isNarrow ? "1fr" : layout.isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
        gap: 14,
      }}>
        <KPI label="Gate events" value={total24h.toLocaleString()} sub="Across all visible gates" theme={theme} />
        <KPI label="In transit now" value={inTransit} sub={`${shipments.length} total tracked`} theme={theme} accent={theme.info} />
        <KPI label="Exceptions" value={exceptions} sub="Requires operator review" theme={theme} accent={theme.warning} />
        <KPI label="Avg confidence" value={avgConfidence.toFixed(3)} sub={`${Math.round((onTime / Math.max(shipments.length, 1)) * 100)}% on-time posture`} theme={theme} mono />
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: layout.isTablet ? "1fr" : "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        gap: 18,
      }}>
        <div style={{
          ...panelStyle(theme, { background: theme.panel, radius: 30 }),
          padding: 0,
          overflow: "hidden",
        }}>
          <div style={{ padding: `${pad}px ${pad}px 0` }}>
            <SectionLabel theme={theme}>Corridors / 24h</SectionLabel>
            <div style={{ marginBottom: 14, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, lineHeight: 1, letterSpacing: "-0.03em" }}>
              Corridor reliability
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 620 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 100px 1fr",
                gap: 16,
                padding: `14px ${pad}px`,
                borderTop: `1px solid ${theme.line}`,
                borderBottom: `1px solid ${theme.line}`,
                background: theme.surface,
                ...smallLabel(theme),
              }}>
                <div>Corridor</div>
                <div style={{ textAlign: "right" }}>Events</div>
                <div style={{ textAlign: "right" }}>ETA delta</div>
                <div>Reliability</div>
              </div>
              {corridorPerformance.map((corridor, index) => (
                <div
                  key={corridor.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 1fr",
                    gap: 16,
                    padding: `14px ${pad}px`,
                    alignItems: "center",
                    borderBottom: index < corridorPerformance.length - 1 ? `1px solid ${theme.line}` : 0,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{corridor.name}</div>
                  <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{corridor.events}</div>
                  <div style={{
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: corridor.avgEta.startsWith("-") ? theme.success : theme.ink,
                  }}>
                    {corridor.avgEta}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: theme.surface }}>
                      <div style={{
                        width: `${corridor.reliability * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: corridor.reliability > 0.95 ? theme.success : corridor.reliability > 0.93 ? theme.accent : theme.warning,
                      }} />
                    </div>
                    <div style={{ width: 50, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {(corridor.reliability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          ...panelStyle(theme, { background: theme.panel, radius: 30 }),
          padding: pad,
        }}>
          <SectionLabel theme={theme}>Gate event volume / 24h</SectionLabel>
          <div style={{ marginBottom: 14, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, lineHeight: 1, letterSpacing: "-0.03em" }}>
            Gate intensity
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {gateVolumes.map((gate) => (
              <div key={gate.id} style={{
                padding: "12px 14px",
                borderRadius: 22,
                background: theme.surface,
                border: `1px solid ${theme.line}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      padding: "3px 7px",
                      borderRadius: 999,
                      background: gate.tier === 1 ? theme.accentWash : theme.panelSolid,
                      color: gate.tier === 1 ? theme.accent : theme.inkMuted,
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      T{gate.tier}
                    </span>
                    <span style={{ fontSize: 12.5 }}>{gate.name}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{gate.vol}</span>
                </div>
                <div style={{ marginTop: 10, height: 7, borderRadius: 999, background: theme.panelSolid }}>
                  <div style={{
                    width: `${(gate.vol / maxVolume) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: gate.tier === 1 ? theme.accent : theme.info,
                    opacity: gate.tier === 1 ? 1 : 0.75,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value, sub, theme, accent, mono }) {
  return (
    <div style={{
      ...panelStyle(theme, { background: theme.panel, radius: 28 }),
      padding: "20px 20px 22px",
    }}>
      <div style={smallLabel(theme)}>{label}</div>
      <div style={{
        marginTop: 10,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Instrument Serif', Georgia, serif",
        fontSize: mono ? 30 : 44,
        lineHeight: 0.95,
        letterSpacing: mono ? 0 : "-0.04em",
        color: accent || theme.ink,
      }}>
        {value}
      </div>
      {sub && <div style={{ marginTop: 10, color: theme.inkMuted, fontSize: 11, lineHeight: 1.55 }}>{sub}</div>}
    </div>
  );
}

function InsightCard({ label, value, theme, accent }) {
  return (
    <div style={{
      padding: "14px 15px",
      borderRadius: 22,
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${theme.line}`,
    }}>
      <div style={smallLabel(theme)}>{label}</div>
      <div style={{
        marginTop: 8,
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: 34,
        lineHeight: 0.95,
        color: accent || theme.ink,
      }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(NTG.features.shipments, {
  ShipmentList,
  ShipmentDetail,
  ExceptionQueue,
  Analytics,
});
