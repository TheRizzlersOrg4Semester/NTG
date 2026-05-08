function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createCheck(check, passed, detail) {
  return {
    check,
    passed: Boolean(passed),
    ...(detail ? { detail } : {}),
  };
}

function findShipment(payload, shipmentId) {
  return payload.SHIPMENTS.find((shipment) => shipment.id === shipmentId || shipment.shipment_id === shipmentId);
}

function findGate(payload, gateId) {
  return payload.GATES.find((gate) => gate.id === gateId || gate.gate_id === gateId);
}

function getEventGateId(event) {
  return event.gate_id || event.gate;
}

function getEventConfidence(event) {
  return toNumber(event.confidence_score ?? event.confidence, 0);
}

function getEventTimestamp(event) {
  return event.timestamp || new Date().toISOString();
}

function activeAssignmentFor(shipment, event) {
  const assignments = shipment.equipment_assignments || [];
  if (!assignments.length) return null;

  const eventTime = new Date(getEventTimestamp(event)).getTime();
  return assignments.find((assignment) => {
    const from = assignment.valid_from ? new Date(assignment.valid_from).getTime() : -Infinity;
    const to = assignment.valid_to ? new Date(assignment.valid_to).getTime() : Infinity;
    return eventTime >= from && eventTime <= to;
  }) || assignments[assignments.length - 1];
}

function collectExpectedEquipment(shipment, event) {
  const assignment = activeAssignmentFor(shipment, event);
  return {
    equipmentIds: [
      shipment.equipment_id,
      shipment.trailer_id,
      assignment?.equipment_id,
      assignment?.trailer_id,
    ].filter(Boolean),
    plateHashes: [
      shipment.tractor_plate_hash,
      assignment?.tractor_plate_hash,
    ].filter(Boolean),
  };
}

function latestAcceptedRouteIndex(shipment) {
  const route = shipment.route || [];
  return (shipment.events || []).reduce((latest, event) => {
    if (event.status === "rejected") return latest;
    const index = route.indexOf(getEventGateId(event));
    return index > latest ? index : latest;
  }, -1);
}

function confidenceStatus(confidence) {
  if (confidence < 0.7) return "rejected";
  if (confidence < 0.9) return "needs_review";
  return "confirmed";
}

function buildReason(status, failedChecks, reviewChecks, confidence) {
  if (failedChecks.some((check) => check.check === "shipment_exists")) return "Shipment was not found.";
  if (failedChecks.some((check) => check.check === "gate_exists")) return "Gate was not found.";
  if (failedChecks.some((check) => check.check === "shipment_active")) return "Shipment is not active for gate-event updates.";
  if (failedChecks.some((check) => check.check === "gate_on_route")) return "Gate is not on the planned route.";
  if (failedChecks.some((check) => check.check === "confidence_threshold")) return `Confidence ${Math.round(confidence * 100)}% is below rejection threshold.`;

  if (reviewChecks.some((check) => check.check === "route_sequence")) return "Gate event is out of expected route sequence and needs operator review.";
  if (reviewChecks.some((check) => check.check === "equipment_match")) return "Equipment or trailer identifier does not match the active assignment.";
  if (reviewChecks.some((check) => check.check === "plate_match")) return "Tractor plate hash does not match the active assignment.";
  if (status === "needs_review") return `Confidence ${Math.round(confidence * 100)}% is below confirmed threshold.`;
  return "Gate matches expected route and equipment.";
}

function validateGateEvent(payload, rawEvent) {
  const event = {
    ...rawEvent,
    gate_id: rawEvent.gate_id || rawEvent.gate,
    shipment_id: rawEvent.shipment_id || rawEvent.shipment,
    confidence_score: getEventConfidence(rawEvent),
    timestamp: getEventTimestamp(rawEvent),
  };

  const checks = [];
  const shipment = findShipment(payload, event.shipment_id);
  const gate = findGate(payload, event.gate_id);

  checks.push(createCheck("shipment_exists", !!shipment));
  checks.push(createCheck("gate_exists", !!gate));

  if (!shipment || !gate) {
    const failedChecks = checks.filter((check) => !check.passed);
    const status = "rejected";
    return {
      status,
      reason: buildReason(status, failedChecks, [], event.confidence_score),
      validation_checks: checks,
      shipment,
      gate,
      normalizedEvent: event,
    };
  }

  const route = shipment.route || [];
  const routeIndex = route.indexOf(event.gate_id);
  const lastIndex = latestAcceptedRouteIndex(shipment);
  const expectedNextIndex = lastIndex + 1;
  const expectedEquipment = collectExpectedEquipment(shipment, event);
  const hasExpectedEquipment = expectedEquipment.equipmentIds.length > 0;
  const hasExpectedPlateHash = expectedEquipment.plateHashes.length > 0;
  const confidence = event.confidence_score;

  checks.push(createCheck("shipment_active", shipment.status === "in-transit" || shipment.status === "at-risk"));
  checks.push(createCheck("gate_on_route", routeIndex >= 0));

  if (routeIndex >= 0) {
    const sequenceOk = routeIndex === expectedNextIndex;
    checks.push(createCheck(
      "route_sequence",
      sequenceOk,
      sequenceOk
        ? `Route index ${routeIndex}; expected ${expectedNextIndex}.`
        : `Route index ${routeIndex}; expected next index ${expectedNextIndex}.`,
    ));
  } else {
    checks.push(createCheck("route_sequence", false, "Gate is outside the expected route."));
  }

  if (hasExpectedEquipment && event.equipment_id) {
    checks.push(createCheck("equipment_match", expectedEquipment.equipmentIds.includes(event.equipment_id)));
  } else {
    checks.push(createCheck("equipment_match", true, "No equipment identifier available for comparison."));
  }

  if (hasExpectedPlateHash && event.plate_hash) {
    checks.push(createCheck("plate_match", expectedEquipment.plateHashes.includes(event.plate_hash)));
  } else {
    checks.push(createCheck("plate_match", true, "No plate hash available for comparison."));
  }

  checks.push(createCheck("confidence_threshold", confidence >= 0.7, `Confidence ${confidence.toFixed(2)}.`));

  const hardFailChecks = checks.filter((check) => (
    !check.passed &&
    ["shipment_exists", "gate_exists", "shipment_active", "gate_on_route", "confidence_threshold"].includes(check.check)
  ));
  const reviewChecks = checks.filter((check) => (
    !check.passed &&
    ["route_sequence", "equipment_match", "plate_match"].includes(check.check)
  ));

  let status = confidenceStatus(confidence);
  if (hardFailChecks.length) status = "rejected";
  if (status === "confirmed" && reviewChecks.length) status = "needs_review";

  return {
    status,
    reason: buildReason(status, hardFailChecks, reviewChecks, confidence),
    validation_checks: checks,
    shipment,
    gate,
    normalizedEvent: event,
  };
}

function toStoredGateEvent(rawEvent, validation) {
  const event = validation.normalizedEvent;
  return {
    event_id: event.event_id || `evt_${Date.now()}`,
    shipment_id: event.shipment_id,
    gate: event.gate_id,
    gate_id: event.gate_id,
    timestamp: event.timestamp,
    confidence: event.confidence_score,
    confidence_score: event.confidence_score,
    status: validation.status,
    reason: validation.reason,
    validation_checks: validation.validation_checks,
    event_type: event.event_type || "GATE_PASSED",
    plate_hash: event.plate_hash,
    equipment_id: event.equipment_id,
    direction: event.direction,
    source: event.source || "SIMULATED_GATE",
  };
}

function ensureException(payload, shipment, storedEvent) {
  payload.EXCEPTIONS = payload.EXCEPTIONS || [];
  const severity = storedEvent.status === "rejected" ? "high" : "medium";
  const type = storedEvent.status === "rejected" ? "REJECTED_GATE_EVENT" : "MANUAL_REVIEW";
  payload.EXCEPTIONS.push({
    exception_id: `exc_${storedEvent.event_id}`,
    shipment_id: shipment.id,
    type,
    severity,
    status: "open",
    reason: storedEvent.reason,
    event_id: storedEvent.event_id,
    gate_id: storedEvent.gate_id,
    timestamp: storedEvent.timestamp,
  });
}

function applyGateEvent(payload, rawEvent) {
  const validation = validateGateEvent(payload, rawEvent);
  const storedEvent = toStoredGateEvent(rawEvent, validation);
  const shipment = validation.shipment;

  if (!shipment) {
    payload.REJECTED_EVENTS = payload.REJECTED_EVENTS || [];
    payload.REJECTED_EVENTS.push(storedEvent);
    return { payload, validation, event: storedEvent, shipment: null };
  }

  shipment.reviewEvents = shipment.reviewEvents || [];

  if (validation.status === "confirmed") {
    const alreadyConfirmed = (shipment.events || []).some((event) => (
      event.event_id === storedEvent.event_id ||
      (getEventGateId(event) === storedEvent.gate_id && event.timestamp === storedEvent.timestamp)
    ));
    if (!alreadyConfirmed) shipment.events.push(storedEvent);
    shipment.progress = Math.min(1, shipment.events.length / shipment.route.length);
    if (shipment.progress >= 1 && shipment.status !== "delivered") {
      shipment.status = "delivered";
    }
  } else {
    shipment.reviewEvents.push(storedEvent);
    ensureException(payload, shipment, storedEvent);
    if (validation.status === "needs_review" && shipment.status === "in-transit") {
      shipment.status = "at-risk";
    }
    if (validation.status === "rejected" && shipment.status !== "delivered") {
      shipment.status = "exception";
    }
  }

  return { payload, validation, event: storedEvent, shipment };
}

module.exports = {
  validateGateEvent,
  applyGateEvent,
  toStoredGateEvent,
};
