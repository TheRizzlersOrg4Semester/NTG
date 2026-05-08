const { deepClone, createGateById } = require("./bootstrap-source");
const { applyGateEvent } = require("./validation-engine");

function cloneShipment(shipment) {
  return {
    ...shipment,
    route: [...shipment.route],
    events: shipment.events.map((event) => ({ ...event })),
    reviewEvents: shipment.reviewEvents ? shipment.reviewEvents.map((event) => ({ ...event })) : undefined,
    equipment_assignments: shipment.equipment_assignments
      ? shipment.equipment_assignments.map((assignment) => ({ ...assignment }))
      : undefined,
    flags: shipment.flags ? [...shipment.flags] : undefined,
  };
}

function clonePayload(payload) {
  return {
    ...deepClone(payload),
    GATE_BY_ID: createGateById(payload.GATES),
  };
}

function buildBootstrapResponse(payload) {
  const cloned = clonePayload(payload);
  delete cloned.GATE_BY_ID;
  return cloned;
}

function simulateNextEvent(payload, now) {
  const working = clonePayload(payload);
  const candidates = working.SHIPMENTS.filter((shipment) => (
    (shipment.status === "in-transit" || shipment.status === "at-risk") &&
    shipment.events.length < shipment.route.length
  ));

  if (candidates.length === 0) {
    return {
      payload: working,
      recentEvent: null,
    };
  }

  const shipment = candidates[Math.floor(Math.random() * candidates.length)];
  return simulateScenarioEvent(working, shipment, now, "confirmed");
}

function activeAssignmentFor(shipment, timestamp) {
  const assignments = shipment.equipment_assignments || [];
  if (!assignments.length) return null;

  const eventTime = new Date(timestamp).getTime();
  return assignments.find((assignment) => {
    const from = assignment.valid_from ? new Date(assignment.valid_from).getTime() : -Infinity;
    const to = assignment.valid_to ? new Date(assignment.valid_to).getTime() : Infinity;
    return eventTime >= from && eventTime <= to;
  }) || assignments[assignments.length - 1];
}

function findScenarioShipment(payload, scenario) {
  const active = payload.SHIPMENTS.filter((shipment) => (
    (shipment.status === "in-transit" || shipment.status === "at-risk") &&
    shipment.events.length < shipment.route.length
  ));

  if (scenario === "equipment_handover") {
    return active.find((shipment) => (shipment.equipment_assignments || []).length > 1) || active[0];
  }

  return active.find((shipment) => shipment.id === "SHP-2026-00421") || active[0];
}

function createScenarioPayload(payload, shipment, now, scenario = "confirmed") {
  const handoverAssignment = scenario === "equipment_handover" ? (shipment.equipment_assignments || [])[1] : null;
  const timestamp = handoverAssignment?.valid_from
    ? new Date(new Date(handoverAssignment.valid_from).getTime() + 15 * 60_000).toISOString()
    : new Date(now).toISOString();
  const nextGateId = shipment.route[shipment.events.length] || shipment.route[shipment.route.length - 1];
  const activeAssignment = activeAssignmentFor(shipment, timestamp);
  const baseEvent = {
    event_id: `evt_${scenario}_${now}`,
    shipment_id: shipment.id,
    gate_id: nextGateId,
    event_type: "GATE_PASSED",
    plate_hash: activeAssignment?.tractor_plate_hash || shipment.tractor_plate_hash,
    equipment_id: activeAssignment?.equipment_id || shipment.equipment_id || shipment.trailer_id,
    timestamp,
    direction: shipment.direction || "INBOUND_DK",
    confidence_score: 0.94,
    source: "SIMULATED_GATE",
  };

  if (scenario === "low_confidence") {
    return { ...baseEvent, confidence_score: 0.82 };
  }

  if (scenario === "wrong_gate") {
    const wrongGate = payload.GATES.find((gate) => !shipment.route.includes(gate.id));
    return {
      ...baseEvent,
      gate_id: wrongGate?.id || "ORS",
      confidence_score: 0.96,
    };
  }

  if (scenario === "route_deviation") {
    const skippedGateId = shipment.route[shipment.events.length + 2] || shipment.route[shipment.events.length + 1];
    return {
      ...baseEvent,
      gate_id: skippedGateId || baseEvent.gate_id,
      confidence_score: 0.93,
    };
  }

  if (scenario === "equipment_handover") {
    const nextAssignment = handoverAssignment || activeAssignment;
    return {
      ...baseEvent,
      plate_hash: nextAssignment?.tractor_plate_hash || baseEvent.plate_hash,
      equipment_id: nextAssignment?.equipment_id || baseEvent.equipment_id,
      confidence_score: 0.95,
    };
  }

  return baseEvent;
}

function simulateScenarioEvent(payload, explicitShipment, now, scenario = "confirmed") {
  const working = clonePayload(payload);
  const shipment = explicitShipment
    ? working.SHIPMENTS.find((item) => item.id === explicitShipment.id) || explicitShipment
    : findScenarioShipment(working, scenario);

  if (!shipment) {
    return {
      payload: working,
      recentEvent: null,
    };
  }

  const eventPayload = createScenarioPayload(working, shipment, now, scenario);
  const result = applyGateEvent(working, eventPayload);
  working.NOW_REF = now;

  return {
    payload: {
      ...working,
      SHIPMENTS: working.SHIPMENTS.map(cloneShipment),
      EXCEPTIONS: working.EXCEPTIONS ? working.EXCEPTIONS.map((exception) => ({ ...exception })) : undefined,
      REJECTED_EVENTS: working.REJECTED_EVENTS ? working.REJECTED_EVENTS.map((event) => ({ ...event })) : undefined,
    },
    recentEvent: {
      shipment: shipment.id,
      gate: working.GATE_BY_ID[eventPayload.gate_id]?.name || eventPayload.gate_id,
      t: Date.now(),
      status: result.validation.status,
      reason: result.validation.reason,
      confidence: result.event.confidence_score,
      scenario,
    },
    validation: result.validation,
    event: result.event,
  };
}

module.exports = {
  buildBootstrapResponse,
  simulateNextEvent,
  simulateScenarioEvent,
};
