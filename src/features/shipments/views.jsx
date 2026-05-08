const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.shipments = NTG.features.shipments || {};

const { useState, useMemo, useDeferredValue } = React;
const { fmtTime, fmtDate, fmtDelta, statusLabel } = NTG.shared.utils.formatters;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { DenmarkMap, LeafletDenmark } = NTG.features.maps;

const STATUS_TONES = {
  scheduled: "muted",
  "in-transit": "info",
  "at-risk": "warning",
  exception: "danger",
  delivered: "success",
};

function statusTone(status) {
  return STATUS_TONES[status] || "default";
}

function reliabilityTone(reliability) {
  if (reliability > 0.95) return "success";
  if (reliability > 0.93) return "accent";
  return "warning";
}

function deltaTrend(value) {
  if (value.startsWith("-")) return "improving";
  if (value.startsWith("+")) return "slipping";
  return "steady";
}

function eventGateId(event) {
  return event.gate_id || event.gate;
}

function gateOwner(gate) {
  return gate?.gate_owner || "NTG partner gate";
}

function gateType(gate) {
  return gate?.gate_type || gate?.type || "Checkpoint";
}

function eventSource(event) {
  return event.source === "SIMULATED_GATE" ? "Simulated partner event" : (event.source || "Partner event");
}

function activeAssignmentFor(shipment, now) {
  const assignments = shipment?.equipment_assignments || [];
  if (!assignments.length) return null;

  return assignments.find((assignment) => {
    const from = assignment.valid_from ? new Date(assignment.valid_from).getTime() : -Infinity;
    const to = assignment.valid_to ? new Date(assignment.valid_to).getTime() : Infinity;
    return now >= from && now <= to;
  }) || assignments[assignments.length - 1];
}

function impactTone(level) {
  if (level === "High") return "danger";
  if (level === "Medium") return "warning";
  return "success";
}

function ShipmentList({ shipments, onSelect, selectedId, density, now }) {
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

  const filters = [
    { id: "all", label: "All", count: shipments.length },
    { id: "in-transit", label: "In transit", count: shipments.filter((shipment) => shipment.status === "in-transit").length },
    { id: "at-risk", label: "At risk", count: shipments.filter((shipment) => shipment.status === "at-risk").length },
    { id: "exception", label: "Exception", count: shipments.filter((shipment) => shipment.status === "exception").length },
    { id: "delivered", label: "Delivered", count: shipments.filter((shipment) => shipment.status === "delivered").length },
    { id: "scheduled", label: "Scheduled", count: shipments.filter((shipment) => shipment.status === "scheduled").length },
  ];

  return (
    <div className="ntg-shipments-view" data-density={density}>
      <section className="ntg-panel ntg-ops-hero">
        <div className="ntg-ops-hero-orb" />
        <div className="ntg-ops-hero-grid">
          <div>
            <div className="ntg-eyebrow">Operations workspace</div>
            <h2 className="ntg-heading-section ntg-ops-hero-heading">Shipment command</h2>
            <p className="ntg-copy ntg-ops-hero-copy">
              A cleaner table for searching, filtering, and opening the live narrative behind each tracked shipment.
            </p>
          </div>

          <div className="ntg-ops-hero-stats">
            <InsightCard label="Tracked" value={shipments.length} />
            <InsightCard label="Moving" value={shipments.filter((shipment) => shipment.status === "in-transit").length} tone="info" />
          </div>
        </div>
      </section>

      <section className="ntg-panel ntg-shipment-toolbar">
        <div className="ntg-search-shell">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search shipment, customer, plate..."
            className="ntg-search-input"
          />
          <svg width="15" height="15" className="ntg-search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>

        <div className="ntg-filter-row">
          {filters.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`ntg-filter-chip${active ? " is-active" : ""}`}
                data-status={option.id === "all" ? "all" : option.id}
              >
                <span>{option.label}</span>
                <span className="ntg-filter-chip-count">{option.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ntg-panel ntg-shipment-table-shell">
        <div className="ntg-scroll ntg-shipment-table-scroll">
          <div className="ntg-shipment-table">
            <div className="ntg-shipment-table-head">
              <div>Shipment</div>
              <div>Customer</div>
              <div>Route</div>
              <div>Progress</div>
              <div>Last gate</div>
              <div>ETA</div>
              <div className="ntg-shipment-table-head-status">Status</div>
            </div>

            {filtered.map((shipment) => {
              const lastEvent = shipment.events[shipment.events.length - 1];
              const lastGate = lastEvent ? shipmentData.GATE_BY_ID[eventGateId(lastEvent)] : null;
              const selected = shipment.id === selectedId;

              return (
                <button
                  key={shipment.id}
                  onClick={() => onSelect(shipment)}
                  className={`ntg-table-row ntg-shipment-table-row${selected ? " is-selected" : ""}`}
                  data-status={shipment.status}
                >
                  <div className="ntg-shipment-meta">
                    <div className="ntg-shipment-id ntg-mono">{shipment.id}</div>
                    <div className="ntg-shipment-subline">{shipment.plate}</div>
                  </div>

                  <div>
                    <div className="ntg-shipment-primary">{shipment.customer}</div>
                    <div className="ntg-shipment-subline ntg-ellipsis">{shipment.cargo}</div>
                  </div>

                  <div>
                    <div className="ntg-shipment-path">
                      <span className="ntg-ellipsis">{shipment.origin}</span>
                      <span className="ntg-shipment-path-arrow">{"->"}</span>
                      <span className="ntg-shipment-path-destination ntg-ellipsis">{shipment.destination}</span>
                    </div>
                    <div className="ntg-shipment-route ntg-mono ntg-ellipsis">{shipment.route.join(" / ")}</div>
                  </div>

                  <div>
                    <div className="ntg-shipment-progress-label ntg-mono">{Math.round(shipment.progress * 100)}%</div>
                    <progress className="ntg-progress ntg-progress--compact" value={shipment.progress} max="1" data-status={shipment.status} />
                  </div>

                  <div className="ntg-shipment-mono-block ntg-mono">
                    {lastGate ? (
                      <>
                        <div className="ntg-shipment-primary ntg-shipment-primary--mono">{lastGate.id}</div>
                        <div className="ntg-shipment-subline">{fmtTime(lastEvent.timestamp)}</div>
                      </>
                    ) : (
                      <span className="ntg-shipments-muted">Awaiting</span>
                    )}
                  </div>

                  <div className="ntg-shipment-mono-block ntg-mono">
                    <div className="ntg-shipment-primary ntg-shipment-primary--mono">{fmtTime(shipment.eta)}</div>
                    <div className="ntg-shipment-subline">{fmtDelta(shipment.eta, now)}</div>
                  </div>

                  <div className="ntg-shipment-status-cell">
                    <span className="ntg-status-pill" data-status={shipment.status}>
                      {statusLabel(shipment.status)}
                    </span>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="ntg-shipments-empty-state">
                No shipments match the current search and filters.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ShipmentDetail({
  shipment,
  onClose,
  accent,
  ink,
  paper,
  now,
  density,
  mapVariant,
  visibleTiers,
  audienceMode = "internal",
  theme,
}) {
  if (!shipment) return null;

  const isCustomerView = audienceMode === "customer";
  const detailMapVariant = mapVariant === "europe-network" ? "geographic" : mapVariant;
  const route = shipment.route.map((id) => shipmentData.GATE_BY_ID[id]).filter(Boolean);
  const eventsByGate = Object.fromEntries(shipment.events.map((event) => [eventGateId(event), event]));
  const lastEventIndex = shipment.events.length - 1;
  const lastEvent = shipment.events[lastEventIndex];
  const lastGate = lastEvent ? shipmentData.GATE_BY_ID[eventGateId(lastEvent)] : null;
  const nextGate = shipment.route[shipment.events.length] ? shipmentData.GATE_BY_ID[shipment.route[shipment.events.length]] : null;
  const shipmentTone = statusTone(shipment.status);
  const activeAssignment = activeAssignmentFor(shipment, now);
  const businessImpact = shipmentService.getBusinessImpact(shipment);
  const handoverFrom = shipment.equipment_assignments?.[0];
  const handoverTo = shipment.equipment_assignments?.[1];

  const segments = [];
  for (let index = 0; index < shipment.events.length - 1; index += 1) {
    const start = new Date(shipment.events[index].timestamp).getTime();
    const end = new Date(shipment.events[index + 1].timestamp).getTime();
    segments.push({ from: eventGateId(shipment.events[index]), to: eventGateId(shipment.events[index + 1]), duration: end - start });
  }

  return (
    <div className="ntg-shipment-detail-backdrop ntg-fade-in">
      <div className="ntg-shipment-detail-drawer ntg-slide-in">
        <div className="ntg-shipment-detail-body" data-density={density}>
          <div className="ntg-panel ntg-detail-hero">
            <div className="ntg-detail-hero-orb" />

            <div className="ntg-detail-hero-header">
              <div className="ntg-detail-hero-copy">
                <div className="ntg-eyebrow">{shipment.id}</div>
                <h2 className="ntg-heading-section ntg-detail-hero-title">
                  {shipment.origin} <span className="ntg-detail-hero-arrow">{"->"}</span> {shipment.destination}
                </h2>
                <div className="ntg-detail-hero-meta">
                  {shipment.customer} / {shipment.cargo}
                </div>
              </div>

              <button onClick={onClose} className="ntg-interactive-button ntg-detail-close">
                Close
              </button>
            </div>
          </div>

          <div className="ntg-detail-stat-grid">
            <Stat label="Status" value={statusLabel(shipment.status)} tone={shipmentTone} />
            <Stat label="ETA" value={fmtTime(shipment.eta)} sub={`${fmtDate(shipment.eta)} / ${fmtDelta(shipment.eta, now)}`} />
            {isCustomerView ? (
              <Stat label="Reference" value={shipment.id.replace("NTG-", "")} sub="Shipment tracking reference" mono />
            ) : (
              <Stat label="Vehicle" value={shipment.plate} sub={shipment.carrier} mono />
            )}
            <Stat label="Weight" value={`${(shipment.weightKg / 1000).toFixed(1)} t`} sub={`${shipment.events.length} of ${shipment.route.length} milestones confirmed`} mono />
          </div>

          <div className="ntg-panel ntg-business-impact-detail" data-impact={businessImpact.customerImpact.toLowerCase()}>
            <div>
              <SectionLabel>Business impact</SectionLabel>
              <div className="ntg-business-impact-title">
                Customer impact: {businessImpact.customerImpact}
              </div>
              <div className="ntg-business-impact-copy">
                {businessImpact.explanation}
              </div>
            </div>
            <div className="ntg-business-impact-grid">
              <DetailLine label="Customer tier" value={businessImpact.customerTier} />
              <DetailLine label="Cargo profile" value={businessImpact.cargoProfile} />
              <DetailLine label="ETA impact" value={`+${businessImpact.etaImpactMinutes} min`} />
              <DetailLine label="SLA risk" value={businessImpact.slaRisk} tone={impactTone(businessImpact.slaRisk)} />
              <DetailLine label="Recommended action" value={businessImpact.recommendedAction} tone={impactTone(businessImpact.customerImpact)} />
            </div>
          </div>

          {(shipment.trailer_id || shipment.equipment_id || shipment.equipment_assignments) && (
            <div className="ntg-panel ntg-equipment-detail">
              <div>
                <SectionLabel>Equipment continuity</SectionLabel>
                <div className="ntg-equipment-detail-title">
                  Trailer / load unit {shipment.trailer_id || shipment.equipment_id}
                </div>
                <div className="ntg-equipment-detail-copy">
                  Carrier handover at Coquelles can change tractor while the trailer/load unit stays attached to the shipment.
                </div>
              </div>
              <div className="ntg-equipment-detail-grid">
                <DetailLine label="Current tractor hash" value={activeAssignment?.tractor_plate_hash || shipment.tractor_plate_hash || "Not available"} />
                <DetailLine label="Carrier" value={activeAssignment?.carrier_id || shipment.carrier || "Not available"} />
                <DetailLine label="Handover status" value={(shipment.equipment_assignments || []).length > 1 ? "Carrier handover supported" : "Single assignment"} tone="info" />
                {handoverFrom && handoverTo && (
                  <DetailLine
                    label="Demo handover"
                    value={`Tractor changed: ${handoverFrom.tractor_plate_hash} -> ${handoverTo.tractor_plate_hash}. Trailer remains ${shipment.trailer_id || shipment.equipment_id}.`}
                    tone="success"
                  />
                )}
              </div>
            </div>
          )}

          {shipment.flags && shipment.flags.length > 0 && (
            <div className="ntg-panel ntg-detail-flag" data-status={shipment.status}>
              <span className="ntg-detail-flag-dot" />
              <div>
                <div className="ntg-detail-flag-title">Operational flag</div>
                <div className="ntg-detail-flag-copy">{shipment.flags.join(" / ")}</div>
              </div>
            </div>
          )}

          <div className="ntg-detail-panels">
            <div className="ntg-panel ntg-detail-map-panel">
              <SectionLabel>Route on network</SectionLabel>
              {mapVariant === "europe-network" && (
                <div className="ntg-detail-map-note">
                  Shipment detail stays on the Denmark route map so checkpoint-level progress remains precise.
                </div>
              )}
              <div className="ntg-detail-map-frame">
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

            <div className="ntg-panel ntg-detail-brief-panel">
              <SectionLabel>Routing brief</SectionLabel>
              <DetailLine label="Last confirmed" value={lastGate ? `${lastGate.name} at ${fmtTime(lastEvent.timestamp)}` : "Awaiting first checkpoint"} />
              <DetailLine label="Next expected" value={nextGate ? nextGate.name : "Final milestone reached"} tone={nextGate ? "info" : "success"} />
              <DetailLine label={isCustomerView ? "Milestones" : "Checkpoints"} value={`${shipment.events.length} confirmed of ${shipment.route.length}`} />
              <DetailLine label="Customer" value={shipment.customer} />
              {!isCustomerView && <DetailLine label="Carrier" value={shipment.carrier} />}
            </div>
          </div>

          <div className="ntg-panel ntg-detail-timeline-panel">
            <SectionLabel>{isCustomerView ? "Milestone timeline" : "Gate event timeline"}</SectionLabel>

            <div className="ntg-timeline">
              <div className="ntg-timeline-track" />
              {route.map((gate, index) => {
                const event = eventsByGate[gate.id];
                const fired = !!event;
                const validationStatus = fired ? shipmentService.confidenceStatus(event) : "pending";
                const isLast = index === route.length - 1;
                const isCurrent = index === lastEventIndex && index < route.length - 1;
                const segment = segments.find((item) => item.to === gate.id);
                const state = fired ? (isCurrent ? "current" : "complete") : "pending";

                return (
                  <div key={`${gate.id}-${index}`} className={`ntg-timeline-entry${isLast ? " is-last" : ""}`} data-state={state}>
                    <div className="ntg-timeline-marker" />

                    <div className="ntg-panel ntg-timeline-card" data-state={state}>
                      <div className="ntg-timeline-header">
                        <div>
                          <div className="ntg-timeline-title">
                            {gate.name}
                            {!fired && <span className="ntg-timeline-tag ntg-timeline-tag--expected">expected</span>}
                            {isCurrent && <span className="ntg-timeline-tag ntg-timeline-tag--current">current</span>}
                            {fired && (
                              <span className="ntg-validation-pill" data-validation-status={validationStatus}>
                                {shipmentService.confidenceLabel(event)}
                              </span>
                            )}
                          </div>
                          <div className="ntg-eyebrow ntg-timeline-meta">
                            {isCustomerView ? gateType(gate) : `${gateOwner(gate)} / ${gateType(gate)}`}
                          </div>
                        </div>

                        <div className="ntg-timeline-right ntg-mono">
                          {fired ? (
                            <>
                              <div className="ntg-timeline-primary">{fmtTime(event.timestamp)}</div>
                              <div className="ntg-timeline-secondary">
                                {fmtDate(event.timestamp)}{!isCustomerView && ` / conf ${shipmentService.confidencePercent(event)}`}
                              </div>
                              {!isCustomerView && (
                                <div className="ntg-timeline-secondary">
                                  {eventSource(event)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="ntg-timeline-awaiting">Awaiting event</div>
                          )}
                        </div>
                      </div>

                      {segment && index > 0 && (
                        <div className="ntg-timeline-leg ntg-mono">
                          leg time {Math.round(segment.duration / 60000)}m
                        </div>
                      )}

                      {fired && validationStatus !== "confirmed" && event.reason && (
                        <div className="ntg-timeline-reason">{event.reason}</div>
                      )}
                      {fired && validationStatus === "confirmed" && event.reason && !isCustomerView && (
                        <div className="ntg-timeline-reason">{event.reason}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {shipment.reviewEvents && shipment.reviewEvents.length > 0 && (
            <div className="ntg-panel ntg-detail-timeline-panel">
              <SectionLabel>Manual review events</SectionLabel>
              <div className="ntg-review-event-list">
                {shipment.reviewEvents.map((event) => {
                  const gate = shipmentData.GATE_BY_ID[eventGateId(event)];
                  const validationStatus = shipmentService.confidenceStatus(event);
                  return (
                    <div key={event.event_id || `${eventGateId(event)}-${event.timestamp}`} className="ntg-review-event-card" data-validation-status={validationStatus}>
                      <div>
                        <div className="ntg-review-event-title">{gate?.name || eventGateId(event)}</div>
                        <div className="ntg-review-event-meta ntg-mono">
                          {shipmentService.confidenceLabel(event)} / confidence {shipmentService.confidencePercent(event)} / {fmtTime(event.timestamp)}
                        </div>
                        <div className="ntg-review-event-meta">
                          {gateOwner(gate)} / {eventSource(event)}
                        </div>
                      </div>
                      <div className="ntg-review-event-reason">{event.reason}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone, mono = false }) {
  return (
    <div className="ntg-panel ntg-detail-stat" data-tone={tone || "default"}>
      <div className="ntg-eyebrow">{label}</div>
      <div className={`ntg-detail-stat-value${mono ? " ntg-mono" : ""}`}>
        {tone && <span className="ntg-detail-stat-dot" />}
        {value}
      </div>
      {sub && <div className="ntg-detail-stat-sub">{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="ntg-eyebrow ntg-section-label">{children}</div>;
}

function DetailLine({ label, value, tone = "default" }) {
  return (
    <div className="ntg-detail-line" data-tone={tone}>
      <div className="ntg-eyebrow">{label}</div>
      <div className="ntg-detail-line-value">{value}</div>
    </div>
  );
}

function ExceptionQueue({ shipments, onSelect, density, now }) {
  const flagged = shipments.filter((shipment) => (
    shipment.status === "exception" ||
    shipment.status === "at-risk" ||
    (shipment.reviewEvents && shipment.reviewEvents.length > 0)
  ));

  return (
    <div className="ntg-exceptions-view" data-density={density}>
      <section className="ntg-panel ntg-ops-hero">
        <div className="ntg-eyebrow">Operational watchlist</div>
        <h2 className="ntg-heading-section ntg-ops-hero-heading">Exceptions</h2>
        <p className="ntg-copy ntg-ops-hero-copy">
          Shipments missing expected milestone confirmations or carrying operational flags that deserve human attention.
        </p>
      </section>

      {flagged.length === 0 && (
        <div className="ntg-panel ntg-exception-empty">
          <div className="ntg-exception-empty-title">All clear.</div>
          <div className="ntg-exception-empty-copy">
            No active exceptions on the visible corridors.
          </div>
        </div>
      )}

      <div className="ntg-exception-list">
        {flagged.map((shipment) => {
          const severity = shipment.status === "exception" ? "Severity 1" : "Severity 2";
          const lastEvent = shipment.events[shipment.events.length - 1];
          const latestReviewEvent = shipment.reviewEvents?.[shipment.reviewEvents.length - 1];
          const lastGate = lastEvent ? shipmentData.GATE_BY_ID[eventGateId(lastEvent)] : null;
          const reviewGate = latestReviewEvent ? shipmentData.GATE_BY_ID[eventGateId(latestReviewEvent)] : null;

          return (
            <button
              key={shipment.id}
              onClick={() => onSelect(shipment)}
              className="ntg-panel ntg-interactive-card ntg-exception-card"
              data-status={shipment.status}
            >
              <div className="ntg-exception-rail" />
              <div>
                <div className="ntg-exception-header">
                  <span className="ntg-eyebrow ntg-exception-severity">{severity}</span>
                  <span className="ntg-mono ntg-exception-id">{shipment.id}</span>
                </div>
                <div className="ntg-exception-title">
                  {latestReviewEvent
                    ? `${shipmentService.confidenceLabel(latestReviewEvent)} at ${reviewGate?.name || eventGateId(latestReviewEvent)}`
                    : shipment.flags ? shipment.flags[0] : "Status flagged"}
                </div>
                <div className="ntg-exception-copy">
                  {shipment.customer} / {shipment.origin} -> {shipment.destination}
                  {lastGate && <> / last seen {lastGate.name} at {fmtTime(lastEvent.timestamp)}</>}
                  {latestReviewEvent && <> / {latestReviewEvent.reason}</>}
                </div>
              </div>
              <div className="ntg-exception-meta ntg-mono">
                <div>ETA {fmtTime(shipment.eta)}</div>
                <div className="ntg-exception-meta-sub">{fmtDelta(shipment.eta, now)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Analytics({ shipments, density }) {
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
    <div className="ntg-analytics-view" data-density={density}>
      <section className="ntg-panel ntg-ops-hero">
        <div className="ntg-eyebrow">Pilot intelligence</div>
        <h2 className="ntg-heading-section ntg-ops-hero-heading">Network performance</h2>
        <p className="ntg-copy ntg-ops-hero-copy">
          A cleaner analytical layer over the synthetic pilot data, tuned for leadership readouts and operational reviews.
        </p>
      </section>

      <section className="ntg-analytics-kpi-grid">
        <KPI label="Gate events" value={total24h.toLocaleString()} sub="Across all visible gates" />
        <KPI label="In transit now" value={inTransit} sub={`${shipments.length} total tracked`} tone="info" />
        <KPI label="Exceptions" value={exceptions} sub="Requires operator review" tone="warning" />
        <KPI label="Avg confidence" value={avgConfidence.toFixed(3)} sub={`${Math.round((onTime / Math.max(shipments.length, 1)) * 100)}% on-time posture`} mono />
      </section>

      <section className="ntg-analytics-panel-grid">
        <div className="ntg-panel ntg-corridor-panel">
          <div className="ntg-corridor-panel-header">
            <SectionLabel>Corridors / 24h</SectionLabel>
            <div className="ntg-corridor-panel-title">Corridor reliability</div>
          </div>

          <div className="ntg-scroll ntg-corridor-table-scroll">
            <div className="ntg-corridor-table">
              <div className="ntg-corridor-table-head">
                <div>Corridor</div>
                <div className="ntg-corridor-align-right">Events</div>
                <div className="ntg-corridor-align-right">ETA delta</div>
                <div>Reliability</div>
              </div>

              {corridorPerformance.map((corridor, index) => (
                <div
                  key={corridor.name}
                  className={`ntg-corridor-row${index === corridorPerformance.length - 1 ? " is-last" : ""}`}
                >
                  <div className="ntg-corridor-name">{corridor.name}</div>
                  <div className="ntg-corridor-value ntg-corridor-align-right ntg-mono">{corridor.events}</div>
                  <div className="ntg-corridor-value ntg-corridor-align-right ntg-mono" data-trend={deltaTrend(corridor.avgEta)}>
                    {corridor.avgEta}
                  </div>
                  <div className="ntg-corridor-reliability">
                    <progress
                      className="ntg-progress"
                      value={corridor.reliability}
                      max="1"
                      data-tone={reliabilityTone(corridor.reliability)}
                    />
                    <div className="ntg-corridor-percent ntg-mono">
                      {(corridor.reliability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ntg-panel ntg-gate-volume-panel">
          <SectionLabel>Gate event volume / 24h</SectionLabel>
          <div className="ntg-gate-volume-title">Gate intensity</div>

          <div className="ntg-gate-volume-list">
            {gateVolumes.map((gate) => (
              <div key={gate.id} className="ntg-gate-volume-card">
                <div className="ntg-gate-volume-top">
                  <div className="ntg-gate-volume-meta">
                    <span className="ntg-tier-badge ntg-mono" data-tier={gate.tier}>T{gate.tier}</span>
                    <span className="ntg-gate-volume-name">{gate.name}</span>
                  </div>
                  <span className="ntg-mono ntg-gate-volume-count">{gate.vol}</span>
                </div>

                <progress
                  className="ntg-progress ntg-progress--gate"
                  value={maxVolume ? gate.vol / maxVolume : 0}
                  max="1"
                  data-tone={gate.tier === 1 ? "accent" : "info"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value, sub, tone = "default", mono = false }) {
  return (
    <div className="ntg-panel ntg-analytics-kpi" data-tone={tone}>
      <div className="ntg-eyebrow">{label}</div>
      <div className={`ntg-analytics-kpi-value${mono ? " ntg-mono ntg-analytics-kpi-value--mono" : ""}`}>
        {value}
      </div>
      {sub && <div className="ntg-analytics-kpi-sub">{sub}</div>}
    </div>
  );
}

function InsightCard({ label, value, tone = "default" }) {
  return (
    <div className="ntg-insight-card" data-tone={tone}>
      <div className="ntg-eyebrow">{label}</div>
      <div className="ntg-insight-card-value">{value}</div>
    </div>
  );
}

Object.assign(NTG.features.shipments, {
  ShipmentList,
  ShipmentDetail,
  ExceptionQueue,
  Analytics,
});
