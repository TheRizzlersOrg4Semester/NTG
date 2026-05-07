const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

const { useMemo } = React;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { LeafletDenmark, DenmarkMap, EuropeNetworkMap } = NTG.features.maps;
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
    <div className="ntg-overview">
      <section className="ntg-panel ntg-overview-hero">
        <div className="ntg-overview-glow ntg-overview-glow--accent" />
        <div className="ntg-overview-glow ntg-overview-glow--info" />

        <div className="ntg-overview-hero-grid">
          <div>
            <div className="ntg-eyebrow">
              {isCustomerView ? `Customer portal / ${customerName}` : "Pilot dashboard / Denmark freight network"}
            </div>
            <h1 className="ntg-heading-display ntg-overview-heading">
              {isCustomerView ? "Premium shipment visibility for your own freight." : "A more polished control room for checkpoint-led freight intelligence."}
            </h1>
            <p className="ntg-overview-copy">
              {isCustomerView
                ? "Follow confirmed milestone events without exposing sensitive network data. The view stays clean, current, and focused on the shipments your team actually needs."
                : "Instead of waiting for manual updates, the network itself confirms movement. Bridges, ports, terminals, and customer checkpoints create a calmer operational picture with time-stamped proof of progress."}
            </p>

            <div className="ntg-overview-chip-row">
              <HeroChip label="Tracked shipments" value={shipments.length} />
              <HeroChip label="Live corridors" value={activeCorridors} />
              <HeroChip label={isCustomerView ? "Milestones confirmed" : "Coverage confidence"} value={isCustomerView ? recent.length : `${trackedCoverage}%`} />
            </div>
          </div>

          <div className="ntg-panel ntg-overview-brief">
            <div>
              <div className="ntg-eyebrow">Operational brief</div>
              <div className="ntg-overview-brief-title">
                {isCustomerView ? "Cleaner customer tracking." : "Executive-grade signal, not noise."}
              </div>
            </div>

            <div className="ntg-overview-brief-metrics">
              <HeroMetric label="Attention needed" value={highlightedAttention} sub="Shipments requiring operator review" tone="warning" />
              <HeroMetric label="Live now" value={stats.inTransit} sub="Tracked loads still moving across the network" tone="info" />
              <HeroMetric label="Current timestamp" value={`${fmtDate(now)} ${fmtTime(now)}`} sub="Synthetic live timeline" tone="success" mono />
            </div>
          </div>
        </div>
      </section>

      <section className="ntg-kpi-grid">
        <BigKPI label="In transit" value={stats.inTransit} note="Actively progressing right now" tone="info" delay={0} />
        <BigKPI label="At risk" value={stats.atRisk} note="Potentially late or degraded" tone="warning" delay={0.04} />
        <BigKPI label="Exceptions" value={stats.exception} note="Requires immediate action" tone="danger" delay={0.08} />
        <BigKPI label="Delivered 24h" value={stats.delivered} note="Successfully closed milestones" tone="success" delay={0.12} />
      </section>

      <section className="ntg-overview-network">
        <div className="ntg-panel ntg-overview-map-panel">
          <div className="ntg-overview-panel-header">
            <div>
              <div className="ntg-eyebrow">
                {isCustomerView ? "Route confirmation" : isEuropeNetwork ? "Imported network view" : "Network view"}
              </div>
              <div className="ntg-overview-panel-title">
                {isCustomerView
                  ? "Your milestone footprint across Denmark"
                  : isEuropeNetwork
                    ? "NTG corridor coverage across the wider European network"
                    : "Checkpoint activity across the pilot corridors"}
              </div>
            </div>
            <div className="ntg-map-badge-row">
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
              />
              <MapBadge label={isEuropeNetwork ? "19 hubs visible" : `${mapGates.length} gates visible`} accent />
            </div>
          </div>

          {requestedEuropeNetwork && isCustomerView && (
            <div className="ntg-overview-note">
              The Europe network view is kept internal-only, so customer mode stays focused on the shipment route footprint.
            </div>
          )}

          <div className="ntg-overview-map-frame">
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

        <aside className="ntg-panel ntg-overview-feed-panel">
          <div className="ntg-overview-feed-header">
            <div>
              <div className="ntg-eyebrow">
                {isCustomerView ? "Recent confirmations" : "Recent gate events"}
              </div>
              <div className="ntg-overview-feed-title">Live event feed</div>
            </div>
            {!isCustomerView && (
              <button onClick={onSimulate} className="ntg-simulate-button">
                Simulate
              </button>
            )}
          </div>

          <div className="ntg-scroll ntg-feed-list">
            {recent.map(({ shipment, event }, index) => {
              const gate = shipmentData.GATE_BY_ID[event.gate];
              return (
                <button
                  key={`${shipment.id}-${index}`}
                  onClick={() => setSelected(shipment)}
                  className="ntg-panel ntg-interactive-card is-soft ntg-feed-card"
                >
                  <div className="ntg-feed-card-header">
                    <div className="ntg-feed-card-gate">
                      <span className="ntg-dot ntg-tone-accent" />
                      <span className="ntg-feed-card-gate-name">{gate?.name}</span>
                    </div>
                    <span className="ntg-feed-card-time">{fmtTime(event.timestamp)}</span>
                  </div>
                  <div className="ntg-feed-card-meta">
                    {shipment.id} / {shipment.customer}
                  </div>
                  <div className="ntg-feed-card-confidence">
                    confidence {event.confidence.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ntg-signal-grid">
            <SignalTile label="Event cadence" value={recent.length} sub="Most recent confirmations in feed" />
            <SignalTile label="Attention" value={highlightedAttention} sub="Loads needing human review" tone="warning" />
          </div>
        </aside>
      </section>

      <section className="ntg-thesis-grid">
        <Thesis
          n="01"
          title="Passive, not dependent"
          body="Visibility no longer relies on driver compliance or manual scans. The infrastructure confirms progress on its own."
        />
        <Thesis
          n="02"
          title="Few checkpoints, broad coverage"
          body="A limited set of strategic chokepoints captures a disproportionate share of the network. The story stays simple and scalable."
        />
        <Thesis
          n="03"
          title="Evidence over surveillance"
          body="The product focuses on trusted milestone events rather than continuous monitoring, which keeps the experience premium and easier to govern."
        />
      </section>
    </div>
  );
}

NTG.features.dashboard.Overview = Overview;
