const { deepClone, createGateById } = require("./bootstrap-source");

function cloneShipment(shipment) {
  return {
    ...shipment,
    route: [...shipment.route],
    events: shipment.events.map((event) => ({ ...event })),
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
  const candidates = working.SHIPMENTS.filter((shipment) => shipment.status === "in-transit" && shipment.events.length < shipment.route.length);

  if (candidates.length === 0) {
    return {
      payload: working,
      recentEvent: null,
    };
  }

  const shipment = candidates[Math.floor(Math.random() * candidates.length)];
  const nextGateId = shipment.route[shipment.events.length];
  const newEvent = {
    gate: nextGateId,
    timestamp: new Date(now).toISOString(),
    confidence: 0.95 + Math.random() * 0.04,
  };

  shipment.events.push(newEvent);
  shipment.progress = Math.min(0.99, shipment.events.length / shipment.route.length);
  working.NOW_REF = now;

  return {
    payload: {
      ...working,
      SHIPMENTS: working.SHIPMENTS.map(cloneShipment),
    },
    recentEvent: {
      shipment: shipment.id,
      gate: working.GATE_BY_ID[nextGateId]?.name || nextGateId,
      t: Date.now(),
    },
  };
}

module.exports = {
  buildBootstrapResponse,
  simulateNextEvent,
};
