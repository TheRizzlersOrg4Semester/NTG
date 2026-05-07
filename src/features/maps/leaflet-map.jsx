// leaflet-map.jsx — real OSM-tiled map of Denmark for the geographic variant.
// Loaded dynamically via CDN to avoid bundling.

const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.maps = NTG.features.maps || {};

const shipmentData = NTG.domain.shipments.data;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletPromise = null;
function loadLeaflet() {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return leafletPromise;
}

NTG.features.maps.leafletRuntime = {
  loadLeaflet,
  cssUrl: LEAFLET_CSS,
  jsUrl: LEAFLET_JS,
};

// Hand-tuned freight-road geometry. Leaflet uses real map tiles underneath; these
// points keep the prototype routes on recognizable Danish road corridors instead
// of drawing abstract straight chords between gates.
const ROAD_SEGMENTS = {
  "PAD>KOL": [[54.83, 9.36], [55.05, 9.32], [55.25, 9.42], [55.49, 9.47]],
  "KOL>VFJ": [[55.49, 9.47], [55.56, 9.50], [55.63, 9.53], [55.71, 9.55]],
  "VFJ>AAR": [[55.71, 9.55], [55.86, 9.85], [56.05, 10.02], [56.16, 10.21]],
  "AAR>AAL": [[56.16, 10.21], [56.42, 10.04], [56.72, 9.97], [57.05, 9.92]],
  "AAL>FRH": [[57.05, 9.92], [57.18, 10.12], [57.31, 10.36], [57.44, 10.54]],
  "AAL>HIR": [[57.05, 9.92], [57.24, 9.88], [57.41, 9.90], [57.59, 9.96]],
  "KOL>TLV": [[55.49, 9.47], [55.53, 9.54], [55.55, 9.59]],
  "VFJ>TLV": [[55.71, 9.55], [55.62, 9.56], [55.55, 9.59]],
  "TLV>OSE": [[55.55, 9.59], [55.48, 9.85], [55.43, 10.10], [55.40, 10.39]],
  "KOL>OSE": [[55.49, 9.47], [55.55, 9.59], [55.48, 9.85], [55.43, 10.10], [55.40, 10.39]],
  "KOL>STB": [[55.49, 9.47], [55.55, 9.59], [55.43, 10.10], [55.36, 10.72], [55.34, 11.04]],
  "OSE>STB": [[55.40, 10.39], [55.36, 10.72], [55.34, 11.04]],
  "STB>CPH": [[55.34, 11.04], [55.40, 11.35], [55.50, 11.75], [55.60, 12.12], [55.68, 12.50]],
  "STB>RKB": [[55.34, 11.04], [55.44, 11.45], [55.58, 11.85], [55.64, 12.08]],
  "CPH>ORS": [[55.68, 12.50], [55.62, 12.60], [55.57, 12.65]],
  "ESJ>TLV": [[55.47, 8.45], [55.50, 8.85], [55.50, 9.20], [55.55, 9.59]],
  "CPH>RBY": [[55.68, 12.50], [55.45, 12.30], [55.18, 12.05], [54.95, 11.82], [54.75, 11.55], [54.66, 11.35]],
  "CPH>GED": [[55.68, 12.50], [55.45, 12.30], [55.18, 12.05], [54.95, 11.95], [54.75, 11.95], [54.57, 11.93]],
  "VFJ>HRS": [[55.71, 9.55], [55.78, 9.66], [55.86, 9.85]],
  "VFJ>ESJ": [[55.71, 9.55], [55.55, 9.45], [55.48, 9.10], [55.47, 8.45]],
  "HIR>AAL": [[57.59, 9.96], [57.41, 9.90], [57.24, 9.88], [57.05, 9.92]],
};

function segmentLatLngs(fromId, toId) {
  const direct = ROAD_SEGMENTS[`${fromId}>${toId}`];
  if (direct) return direct;
  const reverse = ROAD_SEGMENTS[`${toId}>${fromId}`];
  if (reverse) return [...reverse].reverse();
  const a = shipmentData.GATE_BY_ID[fromId];
  const b = shipmentData.GATE_BY_ID[toId];
  return a && b ? [[a.lat, a.lon], [b.lat, b.lon]] : [];
}

function routeLatLngs(gateIds) {
  const points = [];
  gateIds.forEach((id, i) => {
    if (i === 0) {
      const g = shipmentData.GATE_BY_ID[id];
      if (g) points.push([g.lat, g.lon]);
      return;
    }
    const segment = segmentLatLngs(gateIds[i - 1], id);
    segment.forEach((p, j) => {
      if (j === 0 && points.length) return;
      points.push(p);
    });
  });
  return points;
}

function LeafletDenmark({
  gates = shipmentData.GATES,
  corridors = shipmentData.CORRIDORS,
  shipments = [],
  selectedShipmentId = null,
  visibleTiers = { 1: true, 2: true, 3: true, 4: true },
  onShipmentClick,
  onGateClick,
  inkColor = "#1a1814",
  paperColor = "#f6f3ec",
  accentColor = "#c2410c",
  height = 560,
  dark = false,
}) {
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  const layersRef = React.useRef({ gates: null, corridors: null, trails: null, dots: null });
  const [ready, setReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);

  // Init once
  React.useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        center: [56.1, 11.0],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      // Tiles — Carto positron / dark-matter (free, no key)
      const tileUrl = dark
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
      const labelsUrl = dark
        ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, { maxZoom: 18, subdomains: "abcd" }).addTo(map);
      L.tileLayer(labelsUrl, { maxZoom: 18, subdomains: "abcd", opacity: 0.85, pane: "shadowPane" }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      layersRef.current.corridors = L.layerGroup().addTo(map);
      layersRef.current.trails = L.layerGroup().addTo(map);
      layersRef.current.gates = L.layerGroup().addTo(map);
      layersRef.current.dots = L.layerGroup().addTo(map);
      setReady(true);
    }).catch((err) => {
      console.error("Leaflet failed to load", err);
      if (!cancelled) setLoadError("Leaflet could not load. Switch to Schematic map or check CDN access.");
    });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [dark]);

  // Re-render overlays whenever data changes
  React.useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    const {
      gates: gateLayer,
      corridors: corridorLayer,
      trails: trailLayer,
      dots: dotLayer,
    } = layersRef.current;
    if (!gateLayer) return;

    gateLayer.clearLayers();
    corridorLayer.clearLayers();
    trailLayer.clearLayers();
    dotLayer.clearLayers();

    // Corridors
    corridors.forEach(c => {
      const latlngs = routeLatLngs(c.gates);
      L.polyline(latlngs, {
        color: c.color === "ember" ? accentColor : inkColor,
        weight: c.color === "ember" ? 3 : 2,
        opacity: c.color === "ember" ? 0.85 : 0.55,
        dashArray: c.color === "ember" ? null : "4 6",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(corridorLayer);
    });

    // Active shipment trails
    shipments.forEach(s => {
      if (s.status === "scheduled" || s.events.length < 1) return;
      const isSelected = s.id === selectedShipmentId;
      const latlngs = routeLatLngs(s.events.map(e => e.gate));
      if (latlngs.length < 2) return;
      L.polyline(latlngs, {
        color: isSelected ? accentColor : inkColor,
        weight: isSelected ? 4 : 2.4,
        opacity: selectedShipmentId && !isSelected ? 0.18 : (isSelected ? 1 : 0.7),
        lineCap: "round",
      }).addTo(trailLayer);
    });

    // Gates
    gates.forEach(g => {
      if (!visibleTiers[g.tier]) return;
      const r = g.tier === 1 ? 9 : g.tier === 2 ? 7 : g.tier === 3 ? 6 : 5;
      const marker = L.circleMarker([g.lat, g.lon], {
        radius: r,
        fillColor: paperColor,
        color: inkColor,
        weight: 1.8,
        fillOpacity: 1,
      }).addTo(gateLayer);
      // Inner dot
      L.circleMarker([g.lat, g.lon], {
        radius: r * 0.4,
        fillColor: inkColor,
        color: inkColor,
        weight: 0,
        fillOpacity: 1,
      }).addTo(gateLayer);
      // Tier-1 ember halo
      if (g.tier === 1) {
        L.circleMarker([g.lat, g.lon], {
          radius: r + 5,
          fillOpacity: 0,
          color: accentColor,
          weight: 1,
          opacity: 0.5,
        }).addTo(gateLayer);
      }
      marker.bindTooltip(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:600">${g.name}</div>
         <div style="font-family:'JetBrains Mono',monospace;font-size:9px;opacity:.6">Tier ${g.tier} · ${g.type}</div>`,
        { direction: "top", offset: [0, -r - 2], className: "ntg-tip", permanent: false, sticky: false }
      );
      if (onGateClick) marker.on("click", () => onGateClick(g));
    });

    // Truck dots (last gate of each shipment)
    shipments.forEach(s => {
      if (s.status === "scheduled" || s.events.length < 1) return;
      const isSelected = s.id === selectedShipmentId;
      const last = shipmentData.GATE_BY_ID[s.events[s.events.length - 1].gate];
      if (!last) return;
      // Slight offset so dot doesn't sit exactly on gate
      const latlng = [last.lat + 0.02, last.lon + 0.02];
      const dot = L.circleMarker(latlng, {
        radius: isSelected ? 9 : 6,
        fillColor: isSelected ? accentColor : inkColor,
        color: paperColor,
        weight: 2,
        fillOpacity: 1,
        opacity: selectedShipmentId && !isSelected ? 0.2 : 1,
      }).addTo(dotLayer);
      if (onShipmentClick) dot.on("click", () => onShipmentClick(s));
      dot.bindTooltip(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600">${s.id}</div>
         <div style="font-size:11px;margin-top:2px">${s.customer}</div>
         <div style="font-size:10px;opacity:.6;margin-top:2px">${s.origin} → ${s.destination}</div>`,
        { direction: "top", offset: [0, -10], className: "ntg-tip" }
      );
    });
  }, [gates, corridors, shipments, selectedShipmentId, visibleTiers, inkColor, paperColor, accentColor, onShipmentClick, onGateClick, ready]);

  return (
    <div style={{ position: "relative", width: "100%", height, background: dark ? "#1a1c20" : "#eef0ec" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          color: inkColor, fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          opacity: 0.68, zIndex: 450, textAlign: "center", padding: 24,
        }}>
          {loadError || "Loading live map"}
        </div>
      )}
      {/* Floating overlay: title + scale */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 500,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: inkColor, background: `${paperColor}d8`, padding: "6px 10px",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      }}>
        Live network · Denmark · OSM
      </div>
      <div style={{
        position: "absolute", bottom: 8, left: 8, zIndex: 500,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        color: inkColor, opacity: 0.55,
      }}>
        © OpenStreetMap · CARTO
      </div>
    </div>
  );
}

NTG.features.maps.LeafletDenmark = LeafletDenmark;
