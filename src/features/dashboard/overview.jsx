const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.dashboard = NTG.features.dashboard || {};

const { useMemo, useState, useEffect } = React;
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

function gateOwner(gate) {
  return gate?.gate_owner || gate?.owner || "NTG partner gate";
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

const DEMO_STEPS = [
  {
    target: "map",
    title: "UK -> Denmark corridor selected",
    body: "This route contains tunnel, ferry and terminal checkpoints where shipment uncertainty is high.",
  },
  {
    target: "case",
    title: "Verified milestones, not GPS",
    body: "NTG Pulse does not track every road. It verifies key milestones from strategic freight gates.",
  },
  {
    target: "events",
    title: "Partner gate event",
    body: "Gate owners provide event-only data: check-in, departure or arrival confirmations.",
  },
  {
    target: "events",
    title: "Validation and confidence",
    body: "Each event is validated against shipment, equipment, expected route, timing and confidence.",
  },
  {
    target: "attention",
    title: "Needs review",
    body: "Uncertain events are not blindly accepted. They are sent to manual review.",
    scenario: "low_confidence",
  },
  {
    target: "equipment",
    title: "Equipment handover",
    body: "Tracking follows the trailer/load unit. A tractor can change while the shipment continues.",
    scenario: "equipment_handover",
  },
  {
    target: "privacy",
    title: "Privacy-safe event model",
    body: "NTG receives verified shipment events, not live video, full plate databases or non-matching vehicles.",
  },
  {
    target: "value",
    title: "Business value",
    body: "Customer impact helps operators prioritize which delayed or uncertain shipments matter most commercially.",
  },
];

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
  const [demoStepIndex, setDemoStepIndex] = useState(null);
  const [triggeredDemoSteps, setTriggeredDemoSteps] = useState([]);
  const isCustomerView = audienceMode === "customer";
  const primaryShipment = shipments.find((shipment) => shipment.id === "SHP-2026-00421") || shipments[0];
  const primaryRouteGates = primaryShipment?.route?.map((id) => shipmentData.GATE_BY_ID[id]).filter(Boolean) || [];
  const primaryLastEvent = primaryShipment ? lastConfirmedEvent(primaryShipment) : null;
  const primaryLastGate = primaryLastEvent ? shipmentData.GATE_BY_ID[eventGateId(primaryLastEvent)] : null;
  const primaryNextGate = primaryShipment ? shipmentData.GATE_BY_ID[nextGateForShipment(primaryShipment)] : null;
  const primaryAssignment = activeAssignmentFor(primaryShipment, now);
  const primaryImpact = primaryShipment ? shipmentService.getBusinessImpact(primaryShipment) : null;
  const handoverFrom = primaryShipment?.equipment_assignments?.[0];
  const handoverTo = primaryShipment?.equipment_assignments?.[1];
  const visibleShipments = useMemo(() => {
    if (!primaryShipment) return shipments;
    return [
      primaryShipment,
      ...shipments.filter((shipment) => shipment.id !== primaryShipment.id),
    ];
  }, [shipments, primaryShipment]);
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
  const demoStep = demoStepIndex == null ? null : DEMO_STEPS[demoStepIndex];
  const activeDemoTarget = demoStep?.target || null;

  useEffect(() => {
    if (!demoStep?.scenario || triggeredDemoSteps.includes(demoStep.scenario)) return;
    setTriggeredDemoSteps((items) => [...items, demoStep.scenario]);
    onSimulate(demoStep.scenario);
  }, [demoStep, triggeredDemoSteps, onSimulate]);

  const startDemo = () => {
    setTriggeredDemoSteps([]);
    setDemoStepIndex(0);
  };

  const endDemo = () => {
    setDemoStepIndex(null);
  };

  const goNextDemoStep = () => {
    setDemoStepIndex((index) => {
      if (index == null) return 0;
      return Math.min(index + 1, DEMO_STEPS.length - 1);
    });
  };

  const goPreviousDemoStep = () => {
    setDemoStepIndex((index) => {
      if (index == null) return 0;
      return Math.max(index - 1, 0);
    });
  };

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
          <button type="button" className="ntg-demo-start" onClick={startDemo}>
            Start demo
          </button>
          <div>
            <span className="ntg-live-dot ntg-dot" />
            <span>{dataSource === "database" ? "Database synced" : dataSource === "fallback" ? "Fallback mode" : "Checking backend"}</span>
          </div>
          <div>Last updated {fmtDate(now)} {fmtTime(now)} CET</div>
        </div>
      </header>

      <section className="ntg-summary-strip" data-demo-active={activeDemoTarget === "summary" ? "true" : "false"}>
        <Metric label="Active shipments" value={stats.inTransit} />
        <Metric label="Attention needed" value={highlightedAttention} tone={highlightedAttention ? "warning" : "success"} />
        <Metric label="Verified milestones" value={verifiedMilestones} tone="success" />
        <Metric label="Average confidence" value={`${Math.round(avgConfidence * 100)}%`} tone="info" />
      </section>

      {primaryShipment && (
        <section className="ntg-primary-case" data-demo-active={activeDemoTarget === "case" ? "true" : "false"}>
          <div>
            <div className="ntg-eyebrow">Primary demo case</div>
            <h2 className="ntg-primary-title">{primaryShipment.origin} -> {primaryShipment.destination}</h2>
            <div className="ntg-primary-meta">
              <span>{primaryShipment.id}</span>
              <span>{primaryShipment.customer}</span>
              <span>Trailer {primaryShipment.trailer_id || primaryShipment.equipment_id}</span>
            </div>
          </div>
          <div className="ntg-primary-route">
            {primaryRouteGates.map((gate, index) => (
              <React.Fragment key={gate.id}>
                {index > 0 && <span className="ntg-primary-route-line" />}
                <span className="ntg-primary-gate">
                  <span>{gate.name}</span>
                  <small>{gateOwner(gate)}</small>
                </span>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      <section className="ntg-control-grid">
        <div className="ntg-control-main">
          <div className="ntg-section-block ntg-map-block" data-demo-active={activeDemoTarget === "map" ? "true" : "false"}>
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
                  shipments={visibleShipments}
                  selectedShipmentId={selectedShipmentId || primaryShipment?.id}
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
                  shipments={visibleShipments}
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
              {visibleShipments.map((shipment) => {
                const lastEvent = lastConfirmedEvent(shipment);
                const lastGate = lastEvent ? shipmentData.GATE_BY_ID[eventGateId(lastEvent)] : null;
                const nextGate = shipmentData.GATE_BY_ID[nextGateForShipment(shipment)];
                const lastConfidence = lastEvent ? shipmentService.confidencePercent(lastEvent) : "-";
                return (
                  <button key={shipment.id} className="ntg-active-row" onClick={() => setSelected(shipment)} data-status={shipment.status} data-primary={shipment.id === primaryShipment?.id ? "true" : "false"}>
                    <div>
                      <div className="ntg-active-id">{shipment.id}</div>
                      <div className="ntg-active-sub">{shipment.customer}</div>
                    </div>
                    <div className="ntg-active-route">
                      <span>{shipment.origin}</span>
                      <span className="ntg-active-arrow">-></span>
                      <span>{shipment.destination}</span>
                    </div>
                    <div>
                      {lastGate?.name || "Awaiting"}
                      {lastGate && <span className="ntg-active-sub">{gateOwner(lastGate)}</span>}
                    </div>
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
          <div className="ntg-section-block ntg-event-log" data-demo-active={activeDemoTarget === "events" ? "true" : "false"}>
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
            {!isCustomerView && (
              <div className="ntg-scenario-row">
                <button onClick={() => onSimulate("confirmed")}>Confirm</button>
                <button onClick={() => onSimulate("low_confidence")}>Needs review</button>
                <button onClick={() => onSimulate("route_deviation")}>Deviation</button>
                <button onClick={() => onSimulate("wrong_gate")}>Rejected</button>
                <button onClick={() => onSimulate("equipment_handover")}>Handover</button>
              </div>
            )}

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
                      <div className="ntg-feed-source">
                        {gateOwner(gate)} / {gateType(gate)} / {eventSource(event)}
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

          <div className="ntg-section-block ntg-attention-panel" data-demo-active={activeDemoTarget === "attention" ? "true" : "false"}>
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
                const impact = shipmentService.getBusinessImpact(shipment);
                return (
                  <button key={shipment.id} onClick={() => setSelected(shipment)} className="ntg-attention-row">
                    <div>
                      <div className="ntg-active-id">{shipment.id}</div>
                      <div className="ntg-active-sub">{gate?.name || shipment.flags?.[0] || statusLabel(shipment.status)}</div>
                    </div>
                    {reviewEvent && (
                      <div className="ntg-attention-meta">
                        <span>{shipmentService.confidenceLabel(reviewEvent)}</span>
                        <span>{shipmentService.confidencePercent(reviewEvent)}</span>
                        <span>{fmtTime(reviewEvent.timestamp)}</span>
                      </div>
                    )}
                    <div className="ntg-attention-reason">
                      {reviewEvent?.reason || shipment.flags?.[0] || "Operational status requires review"}
                    </div>
                    <div className="ntg-attention-impact" data-impact={impact.customerImpact.toLowerCase()}>
                      <span>Impact {impact.customerImpact}</span>
                      <span>{impact.recommendedAction}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {primaryShipment && (
            <div className="ntg-section-block ntg-equipment-panel" data-demo-active={activeDemoTarget === "equipment" ? "true" : "false"}>
              <div className="ntg-eyebrow">Equipment handover</div>
              <div className="ntg-equipment-grid">
                <Metric label="Trailer / load unit" value={primaryShipment.trailer_id || primaryShipment.equipment_id || "-"} />
                <Metric label="Current tractor hash" value={primaryAssignment?.tractor_plate_hash || primaryShipment.tractor_plate_hash || "-"} />
              </div>
              <div className="ntg-equipment-copy">
                Carrier handover at Coquelles: tractor changed from {handoverFrom?.tractor_plate_hash || "UK tractor"} to {handoverTo?.tractor_plate_hash || "EU tractor"}.
                Trailer remains {primaryShipment.trailer_id || primaryShipment.equipment_id}; shipment tracking continues.
              </div>
            </div>
          )}

          <div className="ntg-section-block ntg-privacy-panel" data-demo-active={activeDemoTarget === "privacy" ? "true" : "false"}>
            <div className="ntg-eyebrow">Privacy-safe event model</div>
            <div className="ntg-privacy-columns">
              <div>
                <div className="ntg-privacy-title">NTG receives</div>
                <ul>
                  <li>shipment_id</li>
                  <li>hashed_plate_id / equipment_id</li>
                  <li>gate_id, timestamp, event_type</li>
                  <li>confidence</li>
                </ul>
              </div>
              <div>
                <div className="ntg-privacy-title">NTG does not receive</div>
                <ul>
                  <li>live video</li>
                  <li>all plates seen</li>
                  <li>non-matching vehicles</li>
                  <li>public camera feeds</li>
                </ul>
              </div>
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

          <div className="ntg-section-block ntg-business-value" data-demo-active={activeDemoTarget === "value" ? "true" : "false"}>
            <div className="ntg-eyebrow">Business impact</div>
            {primaryImpact && (
              <>
                <div className="ntg-impact-grid" data-impact={primaryImpact.customerImpact.toLowerCase()}>
                  <ImpactLine label="Customer tier" value={primaryImpact.customerTier} />
                  <ImpactLine label="Cargo profile" value={primaryImpact.cargoProfile} />
                  <ImpactLine label="ETA impact" value={`+${primaryImpact.etaImpactMinutes} min`} />
                  <ImpactLine label="SLA risk" value={primaryImpact.slaRisk} />
                  <ImpactLine label="Customer impact" value={primaryImpact.customerImpact} emphasized />
                  <ImpactLine label="Recommended action" value={primaryImpact.recommendedAction} emphasized />
                </div>
                <div className="ntg-impact-explanation">{primaryImpact.explanation}</div>
              </>
            )}
            <div className="ntg-value-list">
              <div>
                <strong>Operational saving</strong>
                <span>Fewer manual tracking inquiries</span>
              </div>
              <div>
                <strong>Premium visibility</strong>
                <span>Paid service for high-value, temperature-sensitive or JIT shipments</span>
              </div>
              <div>
                <strong>Tender differentiation</strong>
                <span>Better digital maturity and SLA documentation</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {demoStep && (
        <div className="ntg-demo-guide">
          <div className="ntg-demo-guide-top">
            <span>Step {demoStepIndex + 1} / {DEMO_STEPS.length}</span>
            <button onClick={endDemo}>End demo</button>
          </div>
          <div className="ntg-demo-guide-title">{demoStep.title}</div>
          <div className="ntg-demo-guide-body">{demoStep.body}</div>
          <div className="ntg-demo-guide-actions">
            <button onClick={goPreviousDemoStep} disabled={demoStepIndex === 0}>Back</button>
            <button onClick={goNextDemoStep} disabled={demoStepIndex === DEMO_STEPS.length - 1}>Next</button>
          </div>
        </div>
      )}
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

function ImpactLine({ label, value, emphasized = false }) {
  return (
    <div className="ntg-impact-line" data-emphasized={emphasized ? "true" : "false"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

NTG.features.dashboard.Overview = Overview;
