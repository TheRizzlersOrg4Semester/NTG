// denmark-map.jsx — recognizable SVG map of Denmark with corridors + gates
//
// Outlines built from real geographic landmarks projected into a 1000×720 viewBox.
// Uses a simple equirectangular projection: lon ∈ [7.8, 15.4], lat ∈ [54.4, 57.9]
// Then hand-tuned to read clearly — Jutland's hook in the north, the wide southern
// border with Germany, the bulge of Fyn in the middle, Zealand to the east, and
// Bornholm out in the Baltic.

// Geographic projection: maps lon/lat → SVG x/y
const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.maps = NTG.features.maps || {};

const shipmentData = NTG.domain.shipments.data;

const PROJ = {
  lon0: 7.6, lon1: 15.6,   // west, east
  lat0: 54.3, lat1: 58.05,  // south, north
  // viewBox is 1000 wide × 720 tall, but we want to leave a margin for labels
  x0: 60, x1: 940,
  y0: 70, y1: 660,
};
function proj(lon, lat) {
  const x = PROJ.x0 + ((lon - PROJ.lon0) / (PROJ.lon1 - PROJ.lon0)) * (PROJ.x1 - PROJ.x0);
  // Latitude is flipped — y grows downward, lat grows upward
  const y = PROJ.y0 + ((PROJ.lat1 - lat) / (PROJ.lat1 - PROJ.lat0)) * (PROJ.y1 - PROJ.y0);
  return [x, y];
}
function path(points) {
  return points.map(([lon, lat], i) => {
    const [x, y] = proj(lon, lat);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

// JUTLAND — the mainland peninsula. Traced clockwise starting from Skagen tip.
const JUTLAND_PTS = [
  [10.62, 57.74], // Skagen (NE tip)
  [10.55, 57.50], // east coast down to Frederikshavn
  [10.37, 57.10], // Sæby
  [10.50, 56.90],
  [10.65, 56.60], // Djursland NE bulge
  [10.85, 56.45], // Djursland east tip (Grenaa)
  [10.78, 56.28],
  [10.45, 56.18], // Aarhus bay
  [10.20, 56.10], // south of Aarhus
  [10.10, 55.85], // Horsens fjord
  [10.05, 55.65],
  [10.10, 55.50], // Vejle/Kolding east
  [10.20, 55.30], // Lillebælt north
  [10.10, 55.05], // Als
  [9.90, 54.95], // Sønderborg
  [9.50, 54.83], // south coast east of Padborg
  [9.10, 54.85], // Tønder area, German border
  [8.65, 54.90], // Højer / Wadden Sea
  [8.30, 55.10],
  [8.20, 55.45], // Esbjerg
  [8.10, 55.65], // Blåvandshuk (W tip)
  [8.10, 55.85],
  [8.20, 56.05],
  [8.15, 56.30], // Thyborøn channel
  [8.20, 56.55], // Thy west coast
  [8.35, 56.75],
  [8.60, 57.00], // Hanstholm
  [9.00, 57.15], // Jammerbugt
  [9.50, 57.35],
  [9.85, 57.55], // Hirtshals
  [10.20, 57.70],
  [10.55, 57.75],
];

// VENDSYSSEL bite — Limfjord cuts Jutland; we approximate by inset on east side
// Leave the simplified outline above; Limfjord shown as a thin line below.

// FYN (Funen) — between Lillebælt and Storebælt
const FYN_PTS = [
  [9.70, 55.55],  // NW
  [10.10, 55.65], // Bogense
  [10.50, 55.55], // N coast east
  [10.85, 55.40], // Kerteminde
  [10.90, 55.10], // Nyborg / Storebælt side
  [10.75, 54.95], // S coast
  [10.40, 54.85], // Faaborg
  [10.05, 54.92], // Assens
  [9.85, 55.10],
  [9.75, 55.30],
];

// LANGELAND (long thin island south of Fyn)
const LANGELAND_PTS = [
  [10.78, 55.05], [10.85, 54.95], [10.92, 54.78], [10.85, 54.72],
  [10.75, 54.78], [10.72, 54.95],
];

// ÆRØ
const AERO_PTS = [
  [10.30, 54.90], [10.55, 54.88], [10.55, 54.78], [10.30, 54.80],
];

// ZEALAND (Sjælland) — biggest island, Copenhagen on east coast
const ZEALAND_PTS = [
  [11.30, 55.95], // NW (Sjællands Odde area)
  [11.55, 56.10], // Odden
  [11.85, 56.05], // Hundested area
  [12.15, 56.15], // Helsingør (NE)
  [12.55, 56.05], // Helsingør east bend
  [12.65, 55.85], // Copenhagen N
  [12.65, 55.65], // Copenhagen
  [12.55, 55.45], // Køge
  [12.40, 55.20], // Stevns
  [12.10, 55.05], // South coast
  [11.80, 54.95], // Vordingborg
  [11.55, 54.95],
  [11.30, 55.05], // SW
  [11.10, 55.20], // Korsør (Storebælt west tip)
  [11.00, 55.40],
  [11.05, 55.65],
  [11.15, 55.80],
];

// MØN
const MON_PTS = [
  [12.30, 55.05], [12.55, 55.05], [12.60, 54.92], [12.30, 54.92],
];

// LOLLAND (large flat island south)
const LOLLAND_PTS = [
  [11.00, 54.85], [11.30, 54.92], [11.65, 54.92], [11.95, 54.88],
  [11.95, 54.72], [11.75, 54.65], [11.40, 54.65], [11.10, 54.70],
];

// FALSTER (smaller island east of Lolland)
const FALSTER_PTS = [
  [11.95, 54.92], [12.20, 54.95], [12.25, 54.80], [12.10, 54.65],
  [11.90, 54.62], [11.88, 54.78],
];

// BORNHOLM — out in the Baltic
const BORNHOLM_PTS = [
  [14.70, 55.30], [14.90, 55.30], [15.15, 55.20], [15.15, 55.05],
  [14.95, 54.98], [14.70, 55.02], [14.65, 55.18],
];

// LIMFJORD line — cuts across northern Jutland (Aalborg sits on it)
const LIMFJORD_LINE = [
  [8.20, 56.95], [8.60, 56.78], [9.30, 56.95], [9.85, 57.05],
  [10.30, 57.10], [10.50, 57.30],
];

// Major freight motorways — schematic but geographically correct
const MOTORWAYS = [
  // E45 — Padborg up the spine of Jutland to Frederikshavn
  [[9.36, 54.83], [9.47, 55.49], [9.55, 55.71], [10.00, 56.16], [9.92, 57.05], [10.54, 57.44]],
  // E20 — Esbjerg → Kolding → Storebælt → Copenhagen
  [[8.45, 55.47], [9.15, 55.50], [9.59, 55.55], [10.39, 55.40], [11.04, 55.34], [12.50, 55.68]],
  // E47 — Copenhagen → Rødby (south via Falster)
  [[12.50, 55.68], [12.10, 55.10], [11.88, 54.78], [11.35, 54.66]],
  // E55 — branch to Gedser
  [[12.10, 55.10], [11.93, 54.57]],
  // E39 northern Jutland to Hirtshals
  [[9.92, 57.05], [9.96, 57.59]],
  // Aarhus connector
  [[9.55, 55.71], [10.21, 56.16]],
];

function corridorPoints(gateIds) {
  return gateIds
    .map(id => {
      const g = shipmentData.GATE_BY_ID[id];
      return g ? `${g._x},${g._y}` : null;
    })
    .filter(Boolean)
    .join(" ");
}

// Pre-project gate positions from their lon/lat
(function bindGatePositions() {
  if (!shipmentData.GATES) return;
  shipmentData.GATES.forEach(g => {
    if (g.lon != null && g.lat != null) {
      const [x, y] = proj(g.lon, g.lat);
      g._x = x; g._y = y;
    } else {
      g._x = g.x; g._y = g.y;
    }
  });
})();

function DenmarkMap({
  gates = shipmentData.GATES,
  corridors = shipmentData.CORRIDORS,
  shipments = [],
  selectedShipmentId = null,
  visibleTiers = { 1: true, 2: true, 3: true, 4: true },
  showLabels = true,
  onGateClick,
  onShipmentClick,
  inkColor = "#1a1814",
  paperColor = "#f6f3ec",
  accentColor = "#c2410c",
  mutedColor = "#d8d3c6",
  height = 560,
  variant = "schematic", // "schematic" | "geographic"
}) {
  const isGeo = variant === "geographic";
  const landFill = isGeo ? "url(#dmHatch)" : mutedColor;
  const landStroke = inkColor;

  return (
    <svg viewBox="0 0 1000 720" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <pattern id="dmGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={inkColor} strokeWidth="0.4" opacity="0.06" />
        </pattern>
        <pattern id="dmHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={inkColor} strokeWidth="0.5" opacity="0.45" />
        </pattern>
      </defs>

      {/* sea */}
      <rect width="1000" height="720" fill={paperColor} />
      <rect width="1000" height="720" fill="url(#dmGrid)" />

      {/* coordinate frame text */}
      <g opacity="0.5">
        <text x="24" y="40" fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontSize="10" fill={inkColor} opacity="0.55" letterSpacing="0.08em">
          DENMARK · 55.5°N · ROAD FREIGHT NETWORK
        </text>
        <text x="24" y="700" fontFamily="ui-monospace, monospace" fontSize="10" fill={inkColor} opacity="0.45" letterSpacing="0.08em">
          1:2 500 000 · EQUIRECTANGULAR
        </text>
        <text x="976" y="40" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill={inkColor} opacity="0.45" letterSpacing="0.08em">
          v1.0 · POC
        </text>
      </g>

      {/* graticule (lon/lat lines) */}
      <g opacity="0.18" fontFamily="ui-monospace, monospace" fontSize="8" fill={inkColor}>
        {[8, 9, 10, 11, 12, 13, 14, 15].map(lon => {
          const [x] = proj(lon, 55);
          return (
            <g key={`lon${lon}`}>
              <line x1={x} y1={PROJ.y0} x2={x} y2={PROJ.y1} stroke={inkColor} strokeWidth="0.4" strokeDasharray="2 4" />
              <text x={x + 2} y={PROJ.y1 + 12} opacity="0.7">{lon}°E</text>
            </g>
          );
        })}
        {[55, 56, 57].map(lat => {
          const [, y] = proj(11, lat);
          return (
            <g key={`lat${lat}`}>
              <line x1={PROJ.x0} y1={y} x2={PROJ.x1} y2={y} stroke={inkColor} strokeWidth="0.4" strokeDasharray="2 4" />
              <text x={PROJ.x0 - 4} y={y - 2} textAnchor="end" opacity="0.7">{lat}°N</text>
            </g>
          );
        })}
      </g>

      {/* Landmasses */}
      <g>
        {[
          JUTLAND_PTS, FYN_PTS, ZEALAND_PTS, LOLLAND_PTS, FALSTER_PTS,
          MON_PTS, LANGELAND_PTS, AERO_PTS, BORNHOLM_PTS,
        ].map((pts, i) => (
          <path
            key={i}
            d={path(pts)}
            fill={landFill}
            stroke={landStroke}
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
        ))}

        {/* Limfjord — cuts northern Jutland */}
        <polyline
          points={LIMFJORD_LINE.map(([lo, la]) => proj(lo, la).join(",")).join(" ")}
          fill="none"
          stroke={paperColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={LIMFJORD_LINE.map(([lo, la]) => proj(lo, la).join(",")).join(" ")}
          fill="none"
          stroke={inkColor}
          strokeWidth="0.6"
          opacity="0.5"
          strokeLinecap="round"
        />
      </g>

      {/* Region labels */}
      {showLabels && (
        <g fontFamily="'Instrument Serif', Georgia, serif" fill={inkColor} opacity="0.32" fontStyle="italic">
          <text x={proj(9.0, 56.3)[0]} y={proj(9.0, 56.3)[1]} fontSize="22">Jutland</text>
          <text x={proj(10.30, 55.30)[0]} y={proj(10.30, 55.30)[1]} fontSize="14">Fyn</text>
          <text x={proj(11.85, 55.55)[0]} y={proj(11.85, 55.55)[1]} fontSize="18">Zealand</text>
          <text x={proj(11.55, 54.78)[0]} y={proj(11.55, 54.78)[1]} fontSize="11">Lolland</text>
          <text x={proj(14.85, 55.18)[0]} y={proj(14.85, 55.18)[1]} fontSize="12">Bornholm</text>
          {/* Sea labels */}
          <g fontStyle="normal" fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontSize="9" opacity="0.45" letterSpacing="0.18em">
            <text x={proj(8.5, 56.6)[0]} y={proj(8.5, 56.6)[1]}>NORTH SEA</text>
            <text x={proj(11.5, 56.5)[0]} y={proj(11.5, 56.5)[1]}>KATTEGAT</text>
            <text x={proj(13.0, 55.0)[0]} y={proj(13.0, 55.0)[1]}>BALTIC SEA</text>
            <text x={proj(9.0, 54.5)[0]} y={proj(9.0, 54.5)[1]}>GERMANY</text>
            <text x={proj(13.0, 55.85)[0]} y={proj(13.0, 55.85)[1]}>SWEDEN</text>
          </g>
        </g>
      )}

      {/* Motorway base layer (light) */}
      <g>
        {MOTORWAYS.map((mw, i) => (
          <polyline
            key={i}
            points={mw.map(([lo, la]) => proj(lo, la).join(",")).join(" ")}
            fill="none"
            stroke={inkColor}
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Corridors */}
      <g>
        {corridors.map((c) => (
          <polyline
            key={c.id}
            points={corridorPoints(c.gates)}
            fill="none"
            stroke={c.color === "ember" ? accentColor : inkColor}
            strokeWidth={c.color === "ember" ? 2 : 1.4}
            strokeOpacity={c.color === "ember" ? 0.85 : 0.55}
            strokeDasharray={c.color === "ember" ? "" : "4 5"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Active shipment trails */}
      <g>
        {shipments.map((s) => {
          if (s.status === "scheduled" || s.events.length < 1) return null;
          const passedIds = s.events.map(e => e.gate);
          const points = corridorPoints(passedIds);
          const isSelected = s.id === selectedShipmentId;
          const last = shipmentData.GATE_BY_ID[s.events[s.events.length - 1].gate];
          return (
            <g key={s.id} opacity={selectedShipmentId && !isSelected ? 0.18 : 1}>
              <polyline
                points={points}
                fill="none"
                stroke={isSelected ? accentColor : inkColor}
                strokeWidth={isSelected ? 3 : 1.6}
                strokeOpacity={isSelected ? 1 : 0.65}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {last && (
                <g transform={`translate(${last._x} ${last._y})`}
                   onClick={() => onShipmentClick && onShipmentClick(s)}
                   style={{ cursor: "pointer" }}>
                  {/* One-shot arrival ping — re-keys whenever event count changes */}
                  <circle key={`ping-a-${s.events.length}`}
                          r="6" fill="none"
                          stroke={isSelected ? accentColor : inkColor}
                          strokeWidth="1.8" opacity="0">
                    <animate attributeName="r" from="6" to="34" dur="1.6s" begin="0s" fill="freeze" repeatCount="1" />
                    <animate attributeName="opacity" values="0.85;0" dur="1.6s" begin="0s" fill="freeze" repeatCount="1" />
                    <animate attributeName="stroke-width" values="2.4;0.4" dur="1.6s" begin="0s" fill="freeze" repeatCount="1" />
                  </circle>
                  <circle key={`ping-b-${s.events.length}`}
                          r="6" fill="none"
                          stroke={isSelected ? accentColor : inkColor}
                          strokeWidth="1.4" opacity="0">
                    <animate attributeName="r" from="6" to="26" dur="1.6s" begin="0.25s" fill="freeze" repeatCount="1" />
                    <animate attributeName="opacity" values="0.6;0" dur="1.6s" begin="0.25s" fill="freeze" repeatCount="1" />
                  </circle>

                  <circle r={isSelected ? 8 : 5} fill={isSelected ? accentColor : inkColor} />
                  {isSelected && (
                    <>
                      <circle r="14" fill="none" stroke={accentColor} strokeWidth="1.5">
                        <animate attributeName="r" values="8;22;8" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      <circle r="3" fill={paperColor} />
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Gates */}
      <g>
        {gates.map((g) => {
          if (!visibleTiers[g.tier]) return null;
          const r = g.tier === 1 ? 7 : g.tier === 2 ? 5.5 : g.tier === 3 ? 4.5 : 3.5;
          const labelOffsetY = g.tier === 1 ? -14 : -10;
          return (
            <g key={g.id} transform={`translate(${g._x} ${g._y})`}
               onClick={() => onGateClick && onGateClick(g)}
               style={{ cursor: onGateClick ? "pointer" : "default" }}>
              {g.tier === 1 && (
                <circle r={r + 5} fill="none" stroke={accentColor} strokeWidth="1" opacity="0.5" />
              )}
              <circle r={r} fill={paperColor} stroke={inkColor} strokeWidth="1.6" />
              <circle r={r * 0.4} fill={inkColor} />
              {showLabels && (
                <text
                  y={labelOffsetY}
                  textAnchor="middle"
                  fontFamily="ui-monospace, 'JetBrains Mono', Menlo, monospace"
                  fontSize={g.tier === 1 ? 10.5 : 9}
                  fontWeight={g.tier === 1 ? 600 : 500}
                  fill={inkColor}
                  letterSpacing="0.04em"
                >
                  {g.name.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Compass */}
      <g transform="translate(940 660)" opacity="0.55">
        <circle r="22" fill="none" stroke={inkColor} strokeWidth="0.8" />
        <line x1="0" y1="-22" x2="0" y2="22" stroke={inkColor} strokeWidth="0.6" />
        <line x1="-22" y1="0" x2="22" y2="0" stroke={inkColor} strokeWidth="0.6" />
        <text y="-26" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill={inkColor}>N</text>
      </g>
    </svg>
  );
}

NTG.features.maps.DenmarkMap = DenmarkMap;
