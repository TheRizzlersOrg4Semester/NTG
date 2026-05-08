const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

const { useMemo } = React;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { LeafletDenmark, DenmarkMap, EuropeNetworkMap } = NTG.features.maps;
const { fmtDate, fmtTime, fmtDelta, statusLabel } = NTG.shared.utils.formatters;
const { MapBadge } = NTG.features.dashboard.ui;

function eventGateId(event) {
  return event.gate_id || event.gate;
}

function lastConfirmedEvent(shipment) {
  return shipment.events?.[shipment.events.length - 1] || null;
}

function nextGateForShipment(shipment) {
  return shipment.route?.[shipment.events?.length || 0];
}

function averageConfidence(shipments) {
  const events = shipments.flatMap((shipment) => [
    ...(shipment.events || []),
    ...(shipment.reviewEvents || []),
  ]);
  if (!events.length) return 0;
  const total = events.reduce((sum, event) => sum + Number(event.confidence_score ?? event.confidence ?? 0), 0);
  return total / events.length;
}

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
  dataSource,
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
  const verifiedMilestones = shipments.reduce((sum, shipment) => sum + (shipment.events?.length || 0), 0);
  const avgConfidence = averageConfidence(shipments);
  const attentionShipments = shipments.filter((shipment) => (
    shipment.status === "at-risk" ||
    shipment.status === "exception" ||
    (shipment.reviewEvents && shipment.reviewEvents.length > 0)
  ));
  const mapHeight = layout.isNarrow ? 360 : layout.isTablet ? 420 : 540;

  return (
    <div className="ntg-overview">
      <header className="ntg-ops-header">
        <div>
          <div className="ntg-eyebrow">
            {isCustomerView ? `Customer portal / ${customerName}` : "Internal control tower / NTG Pulse"}
          </div>
          <h1 className="ntg-ops-title">
            Verified freight milestones
          </h1>
        </div>
        <div className="ntg-ops-header-meta">
          <div>
            <span className="ntg-live-dot ntg-dot" />
            <span>{dataSource === "database" ? "Database synced" : dataSource === "fallback" ? "Fallback mode" : "Checking backend"}</span>
          </div>
          <div>Last updated {fmtDate(now)} {fmtTime(now)} CET</div>
        </div>
      </header>

      <section className="ntg-summary-strip">
        <Metric label="Active shipments" value={stats.inTransit} />
        <Metric label="Attention needed" value={highlightedAttention} tone={highlightedAttention ? "warning" : "success"} />
        <Metric label="Verified milestones" value={verifiedMilestones} tone="success" />
        <Metric label="Average confidence" value={`${Math.round(avgConfidence * 100)}%`} tone="info" />
      </section>

      <section className="ntg-control-grid">
        <div className="ntg-control-main">
          <div className="ntg-section-block ntg-map-block">
            <div className="ntg-section-header">
              <div>
                <div className="ntg-eyebrow">
                  {isCustomerView ? "Route confirmation" : isEuropeNetwork ? "Network corridor" : "Shipment corridor map"}
                </div>
                <h2 className="ntg-section-title">
                  {isCustomerView
                    ? "Verified route footprint"
                    : isEuropeNetwork
                      ? "European network coverage"
                      : "Checkpoint activity across active corridors"}
                </h2>
              </div>
              <div className="ntg-map-badge-row">
                <MapBadge
                  label={
                    isEuropeNetwork
                      ? "Europe network"
                      : requestedEuropeNetwork && isCustomerView
                        ? "Customer-safe map"
                        : tweaks.mapVariant === "geographic"
                          ? "Geographic"
                          : "Schematic"
                  }
                />
                <MapBadge label={`${mapGates.length} gates`} accent />
              </div>
            </div>

            {requestedEuropeNetwork && isCustomerView && (
              <div className="ntg-overview-note">
                Europe network view is internal-only; customer mode stays focused on verified shipment milestones.
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

          <div className="ntg-section-block ntg-active-shipments">
            <div className="ntg-section-header">
              <div>
                <div className="ntg-eyebrow">Active shipments</div>
                <h2 className="ntg-section-title">Shipment visibility table</h2>
              </div>
              <MapBadge label={`${shipments.length} visible`} />
            </div>
            <div className="ntg-active-table">
              <div className="ntg-active-table-head">
                <div>Shipment</div>
                <div>Origin -> Destination</div>
                <div>Latest verified</div>
                <div>Next milestone</div>
                <div>ETA</div>
                <div>Confidence</div>
                <div>Status</div>
              </div>
              {shipments.map((shipment) => {
                const lastEvent = lastConfirmedEvent(shipment);
                const lastGate = lastEvent ? shipmentData.GATE_BY_ID[eventGateId(lastEvent)] : null;
                const nextGate = shipmentData.GATE_BY_ID[nextGateForShipment(shipment)];
                const lastConfidence = lastEvent ? shipmentService.confidencePercent(lastEvent) : "-";
                return (
                  <button key={shipment.id} className="ntg-active-row" onClick={() => setSelected(shipment)} data-status={shipment.status}>
                    <div>
                      <div className="ntg-active-id">{shipment.id}</div>
                      <div className="ntg-active-sub">{shipment.customer}</div>
                    </div>
                    <div className="ntg-active-route">
                      <span>{shipment.origin}</span>
                      <span className="ntg-active-arrow">-></span>
                      <span>{shipment.destination}</span>
                    </div>
                    <div>{lastGate?.name || "Awaiting"}</div>
                    <div>{nextGate?.name || "Final milestone"}</div>
                    <div className="ntg-mono">{fmtTime(shipment.eta)} <span className="ntg-active-sub">{fmtDelta(shipment.eta, now)}</span></div>
                    <div className="ntg-mono">{lastConfidence}</div>
                    <div><span className="ntg-status-pill" data-status={shipment.status}>{statusLabel(shipment.status)}</span></div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="ntg-control-rail">
          <div className="ntg-section-block ntg-event-log">
            <div className="ntg-section-header">
              <div>
                <div className="ntg-eyebrow">
                  {isCustomerView ? "Recent confirmations" : "Recent events"}
                </div>
                <h2 className="ntg-section-title">Gate event log</h2>
              </div>
              {!isCustomerView && (
                <button onClick={onSimulate} className="ntg-simulate-button">
                  Simulate
                </button>
              )}
            </div>

            <div className="ntg-scroll ntg-feed-list">
              {recent.map(({ shipment, event }, index) => {
                const gate = shipmentData.GATE_BY_ID[eventGateId(event)];
                const validationStatus = shipmentService.confidenceStatus(event);
                const validationLabel = shipmentService.confidenceLabel(event);
                return (
                  <button
                    key={`${shipment.id}-${index}`}
                    onClick={() => setSelected(shipment)}
                    className="ntg-feed-row"
                    data-validation-status={validationStatus}
                  >
                    <span className="ntg-feed-status-dot" />
                    <div className="ntg-feed-main">
                      <div className="ntg-feed-topline">
                        <span>{gate?.name || eventGateId(event)}</span>
                        <span className="ntg-mono">{fmtTime(event.timestamp)}</span>
                      </div>
                      <div className="ntg-feed-meta">
                        {shipment.id} / {validationLabel} / {shipmentService.confidencePercent(event)}
                      </div>
                      {validationStatus !== "confirmed" && event.reason && (
                        <div className="ntg-feed-reason">{event.reason}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ntg-section-block ntg-attention-panel">
            <div className="ntg-section-header">
              <div>
                <div className="ntg-eyebrow">Attention</div>
                <h2 className="ntg-section-title">Needs review</h2>
              </div>
              <MapBadge label={String(attentionShipments.length)} accent={attentionShipments.length > 0} />
            </div>
            <div className="ntg-attention-list">
              {attentionShipments.length === 0 && (
                <div className="ntg-empty-compact">No shipments require review.</div>
              )}
              {attentionShipments.slice(0, 5).map((shipment) => {
                const reviewEvent = shipment.reviewEvents?.[shipment.reviewEvents.length - 1];
                const gate = reviewEvent ? shipmentData.GATE_BY_ID[eventGateId(reviewEvent)] : null;
                return (
                  <button key={shipment.id} onClick={() => setSelected(shipment)} className="ntg-attention-row">
                    <div>
                      <div className="ntg-active-id">{shipment.id}</div>
                      <div className="ntg-active-sub">{gate?.name || shipment.flags?.[0] || statusLabel(shipment.status)}</div>
                    </div>
                    <div className="ntg-attention-reason">
                      {reviewEvent?.reason || shipment.flags?.[0] || "Operational status requires review"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ntg-section-block ntg-network-summary">
            <div className="ntg-eyebrow">Network summary</div>
            <div className="ntg-network-summary-grid">
              <Metric label="Corridors" value={activeCorridors} />
              <Metric label="Visible gates" value={mapGates.length} />
              <Metric label="Delivered" value={stats.delivered} tone="success" />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "default" }) {
  return (
    <div className="ntg-strip-metric" data-tone={tone}>
      <div className="ntg-strip-label">{label}</div>
      <div className="ntg-strip-value">{value}</div>
    </div>
  );
}

NTG.features.dashboard.Overview = Overview;
