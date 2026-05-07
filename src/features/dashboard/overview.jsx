const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

const { useMemo } = React;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { LeafletDenmark, DenmarkMap, EuropeNetworkMap } = NTG.features.maps;
const { cardStyle } = NTG.app.theme;
const { fmtDate, fmtTime } = NTG.shared.utils.formatters;
const { HeroChip, HeroMetric, BigKPI, MapBadge, SignalTile, Thesis } = NTG.features.dashboard.ui;

function Overview({
  shipments,
  setSelected,
  stats,
  theme,
  now,
  tweaks,
  visibleTiers,
  selectedShipmentId,
  audienceMode,
  customerName,
  onSimulate,
  layout,
}) {
  const pad = tweaks.density === "compact" ? 18 : tweaks.density === "comfy" ? 28 : 22;
  const isCustomerView = audienceMode === "customer";
  const customerGateIds = useMemo(() => new Set(shipments.flatMap((shipment) => shipment.route)), [shipments]);
  const mapGates = isCustomerView ? shipmentData.GATES.filter((gate) => customerGateIds.has(gate.id)) : shipmentData.GATES;
  const mapCorridors = isCustomerView
    ? shipments.map((shipment) => ({ id: shipment.id, name: shipment.id, color: "ember", gates: shipment.route }))
    : shipmentData.CORRIDORS;
  const recent = shipmentService.getRecentShipmentEvents(shipments);
  const requestedEuropeNetwork = tweaks.mapVariant === "europe-network";
  const isEuropeNetwork = requestedEuropeNetwork && !isCustomerView;

  const activeCorridors = new Set(shipments.map((shipment) => `${shipment.origin}->${shipment.destination}`)).size;
  const highlightedAttention = stats.atRisk + stats.exception;
  const trackedCoverage = shipments.length ? Math.round(((stats.inTransit + stats.delivered) / shipments.length) * 100) : 0;
  const mapHeight = layout.isNarrow ? 360 : layout.isTablet ? 420 : 540;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
      <section style={{
        ...cardStyle(theme, {
          background: `linear-gradient(135deg, ${theme.panelSolid} 0%, ${theme.surfaceAlt} 100%)`,
          radius: 34,
          shadow: theme.shadow,
        }),
        padding: layout.isNarrow ? 22 : 30,
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          right: -80,
          top: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.accentWash} 0%, transparent 68%)`,
        }} />
        <div style={{
          position: "absolute",
          left: "18%",
          bottom: -120,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.info}18 0%, transparent 70%)`,
        }} />

        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: layout.isTablet ? "1fr" : "minmax(0, 1.55fr) 340px",
          gap: 18,
          alignItems: "stretch",
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {isCustomerView ? `Customer portal / ${customerName}` : "Pilot dashboard / Denmark freight network"}
            </div>
            <h1 style={{
              margin: "18px 0 0",
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: layout.isNarrow ? 44 : layout.isMobile ? 58 : 72,
              lineHeight: 0.95,
              letterSpacing: "-0.045em",
              fontWeight: 400,
              maxWidth: 760,
            }}>
              {isCustomerView ? "Premium shipment visibility for your own freight." : "A more polished control room for checkpoint-led freight intelligence."}
            </h1>
            <p style={{ margin: "18px 0 0", maxWidth: 640, fontSize: 15, lineHeight: 1.72, color: theme.inkMuted }}>
              {isCustomerView
                ? "Follow confirmed milestone events without exposing sensitive network data. The view stays clean, current, and focused on the shipments your team actually needs."
                : "Instead of waiting for manual updates, the network itself confirms movement. Bridges, ports, terminals, and customer checkpoints create a calmer operational picture with time-stamped proof of progress."}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
              <HeroChip label="Tracked shipments" value={shipments.length} theme={theme} />
              <HeroChip label="Live corridors" value={activeCorridors} theme={theme} />
              <HeroChip label={isCustomerView ? "Milestones confirmed" : "Coverage confidence"} value={isCustomerView ? recent.length : `${trackedCoverage}%`} theme={theme} />
            </div>
          </div>

          <div style={{
            ...cardStyle(theme, {
              background: "rgba(255,255,255,0.03)",
              borderColor: theme.lineStrong,
              radius: 28,
              shadow: "none",
            }),
            padding: layout.isNarrow ? 18 : 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                Operational brief
              </div>
              <div style={{ marginTop: 10, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
                {isCustomerView ? "Cleaner customer tracking." : "Executive-grade signal, not noise."}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <HeroMetric label="Attention needed" value={highlightedAttention} sub="Shipments requiring operator review" theme={theme} tone={theme.warning} />
              <HeroMetric label="Live now" value={stats.inTransit} sub="Tracked loads still moving across the network" theme={theme} tone={theme.info} />
              <HeroMetric label="Current timestamp" value={`${fmtDate(now)} ${fmtTime(now)}`} sub="Synthetic live timeline" theme={theme} tone={theme.success} mono />
            </div>
          </div>
        </div>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: layout.isNarrow ? "1fr" : layout.isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
        gap: 14,
      }}>
        <BigKPI label="In transit" value={stats.inTransit} note="Actively progressing right now" theme={theme} tone={theme.info} delay={0} />
        <BigKPI label="At risk" value={stats.atRisk} note="Potentially late or degraded" theme={theme} tone={theme.warning} delay={0.04} />
        <BigKPI label="Exceptions" value={stats.exception} note="Requires immediate action" theme={theme} tone={theme.danger} delay={0.08} />
        <BigKPI label="Delivered 24h" value={stats.delivered} note="Successfully closed milestones" theme={theme} tone={theme.success} delay={0.12} />
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: layout.isTablet ? "1fr" : "minmax(0, 1.35fr) 360px",
        gap: 18,
        alignItems: "start",
      }}>
        <div style={{
          ...cardStyle(theme, { background: theme.panel, radius: 30 }),
          padding: pad,
          overflow: "hidden",
          minWidth: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                {isCustomerView ? "Route confirmation" : isEuropeNetwork ? "Imported network view" : "Network view"}
              </div>
              <div style={{ marginTop: 6, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
                {isCustomerView
                  ? "Your milestone footprint across Denmark"
                  : isEuropeNetwork
                    ? "NTG corridor coverage across the wider European network"
                    : "Checkpoint activity across the pilot corridors"}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <MapBadge
                label={
                  isEuropeNetwork
                    ? "Europe network"
                    : requestedEuropeNetwork && isCustomerView
                      ? "Customer-safe map"
                      : tweaks.mapVariant === "geographic"
                        ? "Geographic view"
                        : "Schematic view"
                }
                theme={theme}
              />
              <MapBadge label={isEuropeNetwork ? "19 hubs visible" : `${mapGates.length} gates visible`} theme={theme} accent />
            </div>
          </div>

          {requestedEuropeNetwork && isCustomerView && (
            <div style={{
              marginBottom: 14,
              padding: "11px 12px",
              borderRadius: 18,
              background: theme.surface,
              border: `1px solid ${theme.line}`,
              fontSize: 12,
              color: theme.inkMuted,
            }}>
              The Europe network view is kept internal-only, so customer mode stays focused on the shipment route footprint.
            </div>
          )}

          <div style={{
            borderRadius: 26,
            overflow: "hidden",
            border: `1px solid ${theme.line}`,
            background: theme.paper,
          }}>
            {isEuropeNetwork ? (
              <EuropeNetworkMap
                height={mapHeight}
                dark={tweaks.dark}
                inkColor={theme.ink}
                paperColor={theme.paper}
                accentColor={theme.accent}
              />
            ) : tweaks.mapVariant === "geographic" ? (
              <LeafletDenmark
                gates={mapGates}
                corridors={mapCorridors}
                shipments={shipments}
                selectedShipmentId={selectedShipmentId}
                visibleTiers={visibleTiers}
                inkColor={theme.ink}
                paperColor={theme.paper}
                accentColor={theme.accent}
                height={mapHeight}
                dark={tweaks.dark}
                onShipmentClick={(shipment) => setSelected(shipment)}
              />
            ) : (
              <DenmarkMap
                gates={mapGates}
                corridors={mapCorridors}
                shipments={shipments}
                visibleTiers={visibleTiers}
                showLabels={true}
                inkColor={theme.ink}
                paperColor={theme.paper}
                accentColor={theme.accent}
                mutedColor={theme.muted}
                height={mapHeight}
                variant={tweaks.mapVariant}
                onShipmentClick={(shipment) => setSelected(shipment)}
              />
            )}
          </div>
        </div>

        <aside style={{
          ...cardStyle(theme, { background: theme.panel, radius: 30 }),
          padding: pad,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                {isCustomerView ? "Recent confirmations" : "Recent gate events"}
              </div>
              <div style={{ marginTop: 6, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
                Live event feed
              </div>
            </div>
            {!isCustomerView && (
              <button
                onClick={onSimulate}
                style={{
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: theme.accentWash,
                  color: theme.accent,
                  border: `1px solid ${theme.lineStrong}`,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Simulate
              </button>
            )}
          </div>

          <div className="ntg-scroll" style={{ display: "grid", gap: 10, maxHeight: mapHeight - 40, overflow: "auto", paddingRight: 2 }}>
            {recent.map(({ shipment, event }, index) => {
              const gate = shipmentData.GATE_BY_ID[event.gate];
              return (
                <button
                  key={`${shipment.id}-${index}`}
                  onClick={() => setSelected(shipment)}
                  className="ntg-interactive-card is-soft"
                  style={{
                    ...cardStyle(theme, {
                      background: theme.surface,
                      radius: 22,
                      shadow: "none",
                    }),
                    padding: "14px 15px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{gate?.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtTime(event.timestamp)}
                    </span>
                  </div>
                  <div style={{ marginTop: 9, fontSize: 12, color: theme.inkMuted }}>
                    {shipment.id} / {shipment.customer}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 10, color: theme.inkSoft, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em" }}>
                    confidence {event.confidence.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SignalTile label="Event cadence" value={recent.length} sub="Most recent confirmations in feed" theme={theme} />
            <SignalTile label="Attention" value={highlightedAttention} sub="Loads needing human review" theme={theme} accent={theme.warning} />
          </div>
        </aside>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: layout.isTablet ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 14,
      }}>
        <Thesis
          n="01"
          title="Passive, not dependent"
          body="Visibility no longer relies on driver compliance or manual scans. The infrastructure confirms progress on its own."
          theme={theme}
        />
        <Thesis
          n="02"
          title="Few checkpoints, broad coverage"
          body="A limited set of strategic chokepoints captures a disproportionate share of the network. The story stays simple and scalable."
          theme={theme}
        />
        <Thesis
          n="03"
          title="Evidence over surveillance"
          body="The product focuses on trusted milestone events rather than continuous monitoring, which keeps the experience premium and easier to govern."
          theme={theme}
        />
      </section>
    </div>
  );
}

NTG.features.dashboard.Overview = Overview;
