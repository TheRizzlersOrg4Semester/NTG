const NTG = window.NTG = window.NTG || {};
NTG.domain = NTG.domain || {};
NTG.domain.shipments = NTG.domain.shipments || {};

const shipmentData = NTG.domain.shipments.data;
const API_ROOT = "/api";

function cloneBootstrapPayload(data = shipmentData) {
  return {
    GATES: data.GATES.map((gate) => ({ ...gate })),
    CORRIDORS: data.CORRIDORS.map((corridor) => ({ ...corridor, gates: [...corridor.gates] })),
    SHIPMENTS: data.SHIPMENTS.map(cloneShipment),
    GATE_VOLUME_24H: { ...data.GATE_VOLUME_24H },
    EXCEPTIONS: data.EXCEPTIONS ? data.EXCEPTIONS.map((exception) => ({ ...exception })) : undefined,
    REJECTED_EVENTS: data.REJECTED_EVENTS ? data.REJECTED_EVENTS.map((event) => ({ ...event })) : undefined,
    NOW_REF: data.NOW_REF,
  };
}

function createGateById(gates) {
  return Object.fromEntries(gates.map((gate) => [gate.id, gate]));
}

function hydrateBootstrapPayload(payload) {
  const cloned = cloneBootstrapPayload(payload);
  Object.assign(shipmentData, cloned, {
    GATE_BY_ID: createGateById(cloned.GATES),
  });
  return shipmentData;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const LOCAL_BOOTSTRAP_BASELINE = cloneBootstrapPayload(shipmentData);

function cloneEvent(event) {
  return {
    ...event,
    validation_checks: event.validation_checks ? event.validation_checks.map((check) => ({ ...check })) : undefined,
  };
}

function cloneShipment(shipment) {
  return {
    ...shipment,
    route: [...shipment.route],
    events: shipment.events.map(cloneEvent),
    reviewEvents: shipment.reviewEvents ? shipment.reviewEvents.map(cloneEvent) : undefined,
    equipment_assignments: shipment.equipment_assignments
      ? shipment.equipment_assignments.map((assignment) => ({ ...assignment }))
      : undefined,
    flags: shipment.flags ? [...shipment.flags] : undefined,
  };
}

function createInitialShipments() {
  return shipmentData.SHIPMENTS.map(cloneShipment);
}

function getCustomerPortalName(shipments = shipmentData.SHIPMENTS) {
  return shipments.find((shipment) => shipment.customer.includes("Retail Distribution"))?.customer || "Koge Retail Distribution";
}

function getDisplayedShipments(shipments, audienceMode, customerPortalName) {
  if (audienceMode !== "customer") return shipments;
  return shipments.filter((shipment) => shipment.customer === customerPortalName);
}

function buildShipmentStats(shipments) {
  return {
    inTransit: shipments.filter((shipment) => shipment.status === "in-transit").length,
    atRisk: shipments.filter((shipment) => shipment.status === "at-risk").length,
    exception: shipments.filter((shipment) => shipment.status === "exception").length,
    delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
  };
}

function getRecentShipmentEvents(shipments, limit = 8) {
  return shipments
    .flatMap((shipment) => [
      ...(shipment.events || []).map((event) => ({ shipment, event })),
      ...(shipment.reviewEvents || []).map((event) => ({ shipment, event })),
    ])
    .sort((a, b) => new Date(b.event.timestamp) - new Date(a.event.timestamp))
    .slice(0, limit);
}

function simulateNextShipmentEvent({ shipments, visibleShipments, now }) {
  const candidates = visibleShipments.filter((shipment) => shipment.status === "in-transit" && shipment.events.length < shipment.route.length);
  if (candidates.length === 0) return null;

  const shipment = candidates[Math.floor(Math.random() * candidates.length)];
  const nextGateId = shipment.route[shipment.events.length];
  const newEvent = {
    gate: nextGateId,
    timestamp: new Date(now).toISOString(),
    confidence: 0.95 + Math.random() * 0.04,
  };

  const updatedShipment = {
    ...shipment,
    events: [...shipment.events, newEvent],
    progress: Math.min(0.99, (shipment.events.length + 1) / shipment.route.length),
  };

  return {
    shipments: shipments.map((item) => item.id === shipment.id ? updatedShipment : item),
    recentEvent: {
      shipment: shipment.id,
      gate: shipmentData.GATE_BY_ID[nextGateId]?.name || nextGateId,
      t: Date.now(),
    },
  };
}

async function loadBootstrapData() {
  try {
    const result = await requestJson(`${API_ROOT}/bootstrap`);
    hydrateBootstrapPayload(result.payload);
    return {
      source: result.source || "database",
      payload: cloneBootstrapPayload(),
    };
  } catch (error) {
    console.warn("Falling back to local bootstrap data", error);
    hydrateBootstrapPayload(LOCAL_BOOTSTRAP_BASELINE);
    return {
      source: "fallback",
      payload: cloneBootstrapPayload(),
    };
  }
}

async function resetBootstrapData() {
  try {
    const result = await requestJson(`${API_ROOT}/reset`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    hydrateBootstrapPayload(result.payload);
    return {
      source: result.source || "database",
      shipments: createInitialShipments(),
      now: shipmentData.NOW_REF,
    };
  } catch (error) {
    console.warn("Reset API unavailable, using local fallback", error);
    hydrateBootstrapPayload(LOCAL_BOOTSTRAP_BASELINE);
    return {
      source: "fallback",
      shipments: createInitialShipments(),
      now: shipmentData.NOW_REF,
    };
  }
}

async function simulateNextShipmentEventRemote({ shipments, visibleShipments, now, scenario = "confirmed" }) {
  try {
    const result = await requestJson(`${API_ROOT}/simulate`, {
      method: "POST",
      body: JSON.stringify({ now, scenario }),
    });
    hydrateBootstrapPayload(result.payload);
    return {
      source: result.source || "database",
      shipments: createInitialShipments(),
      recentEvent: result.recentEvent,
      now: shipmentData.NOW_REF,
    };
  } catch (error) {
    console.warn("Simulation API unavailable, using local fallback", error);
    const fallback = simulateNextShipmentEvent({ shipments, visibleShipments, now });
    if (!fallback) {
      return {
        source: "fallback",
        shipments,
        recentEvent: null,
        now,
      };
    }
    shipmentData.SHIPMENTS = fallback.shipments.map(cloneShipment);
    return {
      source: "fallback",
      shipments: fallback.shipments,
      recentEvent: fallback.recentEvent,
      now,
    };
  }
}

function confidenceStatus(event) {
  const status = event.status;
  if (status === "confirmed" || status === "needs_review" || status === "rejected") return status;

  const confidence = Number(event.confidence_score ?? event.confidence ?? 0);
  if (confidence < 0.7) return "rejected";
  if (confidence < 0.9) return "needs_review";
  return "confirmed";
}

function confidenceLabel(event) {
  return ({
    confirmed: "Confirmed",
    needs_review: "Needs review",
    rejected: "Rejected",
  })[confidenceStatus(event)] || "Confirmed";
}

function confidencePercent(event) {
  const confidence = Number(event.confidence_score ?? event.confidence ?? 0);
  return `${Math.round(confidence * 100)}%`;
}

NTG.domain.shipments.service = {
  cloneBootstrapPayload,
  hydrateBootstrapPayload,
  createInitialShipments,
  getCustomerPortalName,
  getDisplayedShipments,
  buildShipmentStats,
  getRecentShipmentEvents,
  simulateNextShipmentEvent,
  loadBootstrapData,
  resetBootstrapData,
  simulateNextShipmentEventRemote,
  confidenceStatus,
  confidenceLabel,
  confidencePercent,
};
