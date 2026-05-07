// data.jsx — synthetic shipment + gate dataset for NTG Smart Checkpoints

// Gates: { id, name, tier (1-4), x, y } — coordinates in our 1000x720 Denmark viewBox
const NTG = window.NTG = window.NTG || {};
NTG.domain = NTG.domain || {};
NTG.domain.shipments = NTG.domain.shipments || {};

const GATES = [
  // Tier 1 — National chokepoints
  { id: "PAD", name: "Padborg",          tier: 1, type: "Border",   x: 360, y: 600, lon: 9.36, lat: 54.83 },
  { id: "KOL", name: "Kolding Junction", tier: 1, type: "Junction", x: 410, y: 470, lon: 9.47, lat: 55.49 },
  { id: "VFJ", name: "Vejlefjord",       tier: 1, type: "Bridge",   x: 425, y: 415, lon: 9.55, lat: 55.71 },
  { id: "STB", name: "Storebælt East",   tier: 1, type: "Bridge",   x: 600, y: 460, lon: 11.04, lat: 55.34 },
  { id: "ORS", name: "Øresund",          tier: 1, type: "Bridge",   x: 800, y: 440, lon: 12.65, lat: 55.57 },
  // Tier 2 — Ports & ferry nodes
  { id: "HIR", name: "Hirtshals",        tier: 2, type: "Ferry Port",x: 410, y: 130, lon: 9.96, lat: 57.59 },
  { id: "FRH", name: "Frederikshavn",    tier: 2, type: "Ferry Port",x: 470, y: 155, lon: 10.54, lat: 57.44 },
  { id: "AAR", name: "Aarhus Port",      tier: 2, type: "Sea Port",  x: 450, y: 320, lon: 10.21, lat: 56.16 },
  { id: "RBY", name: "Rødby",            tier: 2, type: "Ferry Port",x: 690, y: 600, lon: 11.35, lat: 54.66 },
  { id: "GED", name: "Gedser",           tier: 2, type: "Ferry Port",x: 740, y: 620, lon: 11.93, lat: 54.57 },
  // Tier 3 — Logistics hubs
  { id: "TLV", name: "Taulov Hub",       tier: 3, type: "Hub",      x: 405, y: 460, lon: 9.59, lat: 55.55 },
  { id: "OSE", name: "Odense Belt",      tier: 3, type: "Hub",      x: 530, y: 480, lon: 10.39, lat: 55.40 },
  { id: "AAL", name: "Aalborg",          tier: 3, type: "Hub",      x: 445, y: 195, lon: 9.92, lat: 57.05 },
  { id: "CPH", name: "Copenhagen Belt",  tier: 3, type: "Hub",      x: 770, y: 425, lon: 12.50, lat: 55.68 },
  // Tier 4 — Private customer sites
  { id: "ESJ", name: "Esbjerg Yard",     tier: 4, type: "Yard",     x: 305, y: 460, lon: 8.45, lat: 55.47 },
  { id: "RKB", name: "Roskilde Dock",    tier: 4, type: "Dock",     x: 730, y: 425, lon: 12.08, lat: 55.64 },
  { id: "HRS", name: "Horsens Yard",     tier: 4, type: "Yard",     x: 425, y: 380, lon: 9.85, lat: 55.86 },
];

// Corridors — schematic polyline paths through the gate IDs
const CORRIDORS = [
  { id: "A", name: "Corridor A · Germany → Jutland", color: "ember",  gates: ["PAD", "KOL", "VFJ", "AAR", "AAL"] },
  { id: "B", name: "Corridor B · Jutland → Zealand",  color: "ink",    gates: ["TLV", "OSE", "STB", "CPH"] },
  { id: "C", name: "Corridor C · Copenhagen → Sweden", color: "ember", gates: ["CPH", "ORS"] },
  { id: "D", name: "Corridor D · Northern Ports",     color: "ink",    gates: ["AAL", "FRH", "HIR"] },
  { id: "E", name: "Corridor E · Rødby Ferry Spine",  color: "ink",    gates: ["CPH", "RBY"] },
];

const GATE_BY_ID = Object.fromEntries(GATES.map(g => [g.id, g]));

// ─── Shipments ──────────────────────────────────────────────────────────────
// Status: in-transit | delivered | at-risk | exception | scheduled
// Each has a route (gate IDs) and an `events` array, with `passedCount` events fired.

const NOW_REF = new Date("2026-04-26T14:32:00+02:00").getTime();
const M = 60_000;

function evt(gateId, offsetMin, confidence = 0.97) {
  return {
    gate: gateId,
    timestamp: new Date(NOW_REF + offsetMin * M).toISOString(),
    confidence,
  };
}

const SHIPMENTS = [
  {
    id: "NTG-2611-9842",
    customer: "Skagen Cold Chain A/S",
    origin: "Hamburg, DE",
    destination: "Copenhagen, DK",
    cargo: "Refrigerated · 18 pallets",
    weightKg: 14_200,
    plate: "BV 47 821",
    carrier: "NTG Road North",
    eta: NOW_REF + 78 * M,
    status: "in-transit",
    progress: 0.68,
    route: ["PAD", "KOL", "VFJ", "TLV", "STB", "CPH"],
    events: [
      evt("PAD", -312, 0.99),
      evt("KOL", -198, 0.97),
      evt("VFJ", -154, 0.96),
      evt("TLV", -132, 0.98),
    ],
  },
  {
    id: "NTG-2612-3317",
    customer: "Mälmo Industri AB",
    origin: "Rotterdam, NL",
    destination: "Malmö, SE",
    cargo: "General · 24 pallets",
    weightKg: 19_400,
    plate: "AC 11 309",
    carrier: "NTG Road North",
    eta: NOW_REF + 14 * M,
    status: "in-transit",
    progress: 0.92,
    route: ["PAD", "KOL", "STB", "CPH", "ORS"],
    events: [
      evt("PAD", -480), evt("KOL", -374), evt("STB", -212), evt("CPH", -42),
    ],
  },
  {
    id: "NTG-2612-4001",
    customer: "Nord Marine Logistics",
    origin: "Oslo, NO",
    destination: "Aalborg, DK",
    cargo: "Heavy · 12 pallets",
    weightKg: 22_100,
    plate: "DE 33 117",
    carrier: "Partner · ScanLink",
    eta: NOW_REF - 22 * M,
    status: "delivered",
    progress: 1,
    route: ["HIR", "AAL"],
    events: [evt("HIR", -180), evt("AAL", -22, 0.99)],
  },
  {
    id: "NTG-2612-4488",
    customer: "Vestjysk Møbel ApS",
    origin: "Esbjerg, DK",
    destination: "Stockholm, SE",
    cargo: "Furniture · 32 pallets",
    weightKg: 11_800,
    plate: "BV 91 044",
    carrier: "NTG Road North",
    eta: NOW_REF + 264 * M,
    status: "at-risk",
    progress: 0.41,
    route: ["ESJ", "TLV", "OSE", "STB", "CPH", "ORS"],
    events: [
      evt("ESJ", -286), evt("TLV", -182, 0.94),
    ],
    flags: ["Storebælt closure window 16:00–17:30"],
  },
  {
    id: "NTG-2612-5102",
    customer: "BlueGrid Energy",
    origin: "Padborg, DK",
    destination: "Frederikshavn, DK",
    cargo: "Wind components · oversize",
    weightKg: 41_500,
    plate: "AC 22 700",
    carrier: "NTG Heavy",
    eta: NOW_REF + 142 * M,
    status: "in-transit",
    progress: 0.55,
    route: ["PAD", "KOL", "VFJ", "AAR", "AAL", "FRH"],
    events: [
      evt("PAD", -402), evt("KOL", -298), evt("VFJ", -244), evt("AAR", -130, 0.93),
    ],
  },
  {
    id: "NTG-2612-5340",
    customer: "Køge Retail Distribution",
    origin: "Hamburg, DE",
    destination: "Køge, DK",
    cargo: "FMCG · 28 pallets",
    weightKg: 16_900,
    plate: "BV 18 552",
    carrier: "NTG Road North",
    eta: NOW_REF + 38 * M,
    status: "in-transit",
    progress: 0.81,
    route: ["PAD", "KOL", "OSE", "STB", "CPH"],
    events: [
      evt("PAD", -260), evt("KOL", -174), evt("OSE", -88), evt("STB", -24, 0.98),
    ],
  },
  {
    id: "NTG-2612-5612",
    customer: "Nordic Pharma Holding",
    origin: "Aarhus, DK",
    destination: "Hamburg, DE",
    cargo: "Pharma · temp-controlled",
    weightKg: 8_400,
    plate: "DE 44 220",
    carrier: "NTG Road North",
    eta: NOW_REF + 196 * M,
    status: "in-transit",
    progress: 0.34,
    route: ["AAR", "VFJ", "KOL", "PAD"],
    events: [evt("AAR", -118), evt("VFJ", -42, 0.97)],
  },
  {
    id: "NTG-2612-5784",
    customer: "Bornholm Fresh Co.",
    origin: "Rønne, DK",
    destination: "Copenhagen, DK",
    cargo: "Seafood · cooled",
    weightKg: 5_200,
    plate: "BV 02 991",
    carrier: "Partner · ScanLink",
    eta: NOW_REF - 88 * M,
    status: "exception",
    progress: 0.62,
    route: ["RBY", "CPH"],
    events: [evt("RBY", -244, 0.96)],
    flags: ["Expected at Copenhagen Belt 88 min ago — no event"],
  },
  {
    id: "NTG-2612-5810",
    customer: "Skive Construction Group",
    origin: "Padborg, DK",
    destination: "Aalborg, DK",
    cargo: "Building materials",
    weightKg: 28_300,
    plate: "AC 76 333",
    carrier: "NTG Heavy",
    eta: NOW_REF + 102 * M,
    status: "in-transit",
    progress: 0.59,
    route: ["PAD", "KOL", "VFJ", "AAR", "AAL"],
    events: [
      evt("PAD", -340), evt("KOL", -248), evt("VFJ", -196), evt("AAR", -88, 0.97),
    ],
  },
  {
    id: "NTG-2612-6021",
    customer: "Helsingør Marine",
    origin: "Copenhagen, DK",
    destination: "Helsingborg, SE",
    cargo: "Mixed · 14 pallets",
    weightKg: 9_100,
    plate: "BV 55 100",
    carrier: "NTG Road North",
    eta: NOW_REF - 6 * M,
    status: "delivered",
    progress: 1,
    route: ["CPH", "ORS"],
    events: [evt("CPH", -78), evt("ORS", -6, 0.99)],
  },
  {
    id: "NTG-2612-6155",
    customer: "Fjord Forest Products",
    origin: "Oslo, NO",
    destination: "Esbjerg, DK",
    cargo: "Timber · 26 pallets",
    weightKg: 24_700,
    plate: "DE 18 444",
    carrier: "Partner · ScanLink",
    eta: NOW_REF + 224 * M,
    status: "in-transit",
    progress: 0.28,
    route: ["HIR", "AAL", "AAR", "VFJ", "ESJ"],
    events: [evt("HIR", -94, 0.95)],
  },
  {
    id: "NTG-2612-6298",
    customer: "Køge Retail Distribution",
    origin: "Padborg, DK",
    destination: "Roskilde, DK",
    cargo: "FMCG · 22 pallets",
    weightKg: 13_700,
    plate: "BV 71 008",
    carrier: "NTG Road North",
    eta: NOW_REF + 56 * M,
    status: "at-risk",
    progress: 0.74,
    route: ["PAD", "KOL", "OSE", "STB", "RKB"],
    events: [
      evt("PAD", -298), evt("KOL", -204), evt("OSE", -118, 0.92), evt("STB", -28),
    ],
    flags: ["Confidence drop at Odense gate"],
  },
  {
    id: "NTG-2612-6404",
    customer: "Greater CPH Industrial",
    origin: "Padborg, DK",
    destination: "Copenhagen, DK",
    cargo: "Mixed · 30 pallets",
    weightKg: 17_200,
    plate: "BV 33 612",
    carrier: "NTG Road North",
    eta: NOW_REF + 12 * M,
    status: "in-transit",
    progress: 0.94,
    route: ["PAD", "KOL", "OSE", "STB", "CPH"],
    events: [
      evt("PAD", -502), evt("KOL", -396), evt("OSE", -284), evt("STB", -158), evt("CPH", -8, 0.99),
    ],
  },
  {
    id: "NTG-2612-6512",
    customer: "Horsens Industrial Park",
    origin: "Rotterdam, NL",
    destination: "Horsens, DK",
    cargo: "Industrial · 18 pallets",
    weightKg: 15_400,
    plate: "DE 91 007",
    carrier: "NTG Road North",
    eta: NOW_REF + 168 * M,
    status: "scheduled",
    progress: 0,
    route: ["PAD", "KOL", "VFJ", "HRS"],
    events: [],
  },
  {
    id: "NTG-2612-6633",
    customer: "Aarhus Port Authority",
    origin: "Hamburg, DE",
    destination: "Aarhus, DK",
    cargo: "Containers · 2 TEU",
    weightKg: 26_800,
    plate: "BV 84 559",
    carrier: "NTG Road North",
    eta: NOW_REF + 64 * M,
    status: "in-transit",
    progress: 0.72,
    route: ["PAD", "KOL", "VFJ", "AAR"],
    events: [
      evt("PAD", -240), evt("KOL", -158), evt("VFJ", -98, 0.97),
    ],
  },
];

// Aggregate gate event counts (last 24h)
const GATE_VOLUME_24H = {
  PAD: 218, KOL: 312, VFJ: 188, STB: 274, ORS: 196,
  HIR: 88, FRH: 71, AAR: 152, RBY: 64, GED: 43,
  TLV: 168, OSE: 144, AAL: 119, CPH: 287,
  ESJ: 36, RKB: 22, HRS: 18,
};

NTG.domain.shipments.data = {
  GATES,
  GATE_BY_ID,
  CORRIDORS,
  SHIPMENTS,
  GATE_VOLUME_24H,
  NOW_REF,
};
