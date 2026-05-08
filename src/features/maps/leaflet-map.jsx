// leaflet-map.jsx - real OSM-tiled map of Denmark for the geographic variant.
// Loaded dynamically via CDN to avoid bundling.

const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.maps = NTG.features.maps || {};

const shipmentData = NTG.domain.shipments.data;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletPromise = null;
function loadLeaflet() {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
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
  "UK_ORIGIN_LICHFIELD>FOLKESTONE_CHECKIN": [[52.68, -1.82], [52.49, -1.89], [52.19, -1.72], [51.75, -1.26], [51.51, -0.13], [51.29, 0.50], [51.10, 1.16]],
  "FOLKESTONE_CHECKIN>CALAIS_EXIT": [[51.10, 1.16], [51.02, 1.38], [50.96, 1.64], [50.95, 1.86]],
  "FOLKESTONE_CHECKIN>COQUELLES_EXIT": [[51.10, 1.16], [51.02, 1.38], [50.96, 1.64], [50.93, 1.81]],
  "DOVER_CHECKIN>CALAIS_EXIT": [[51.13, 1.31], [51.08, 1.45], [51.00, 1.68], [50.95, 1.86]],
  "COQUELLES_EXIT>CALAIS_EXIT": [[50.93, 1.81], [50.94, 1.84], [50.95, 1.86]],
  "CALAIS_EXIT>PUTTGARDEN_CHECKIN": [
    [50.95, 1.86], [51.03, 2.38], [51.20, 3.22], [51.05, 3.72],
    [51.22, 4.40], [51.44, 5.48], [51.37, 6.17], [51.51, 6.76],
    [51.96, 7.63], [52.28, 8.05], [52.38, 9.73], [53.08, 9.39],
    [53.55, 9.99], [53.87, 10.69], [54.10, 10.82], [54.32, 11.02],
    [54.50, 11.22],
  ],
  "COQUELLES_EXIT>PUTTGARDEN_CHECKIN": [
    [50.93, 1.81], [50.95, 1.86], [51.03, 2.38], [51.20, 3.22],
    [51.05, 3.72], [51.22, 4.40], [51.44, 5.48], [51.37, 6.17],
    [51.51, 6.76], [51.96, 7.63], [52.28, 8.05], [52.38, 9.73],
    [53.08, 9.39], [53.55, 9.99], [53.87, 10.69], [54.10, 10.82],
    [54.32, 11.02], [54.50, 11.22],
  ],
  "COQUELLES_EXIT>HAMBURG_CORRIDOR": [
    [50.93, 1.81], [51.03, 2.38], [51.20, 3.22], [51.05, 3.72],
    [51.22, 4.40], [51.44, 5.48], [51.37, 6.17], [51.51, 6.76],
    [51.96, 7.63], [52.28, 8.05], [52.38, 9.73], [53.08, 9.39],
    [53.55, 9.99],
  ],
  "CALAIS_EXIT>HAMBURG_CORRIDOR": [
    [50.95, 1.86], [51.03, 2.38], [51.20, 3.22], [51.05, 3.72],
    [51.22, 4.40], [51.44, 5.48], [51.37, 6.17], [51.51, 6.76],
    [51.96, 7.63], [52.28, 8.05], [52.38, 9.73], [53.08, 9.39],
    [53.55, 9.99],
  ],
  "HAMBURG_CORRIDOR>PUTTGARDEN_CHECKIN": [[53.55, 9.99], [53.87, 10.69], [54.10, 10.82], [54.32, 11.02], [54.50, 11.22]],
  "PUTTGARDEN_CHECKIN>RODBY_EXIT": [[54.50, 11.22], [54.56, 11.25], [54.61, 11.30], [54.66, 11.35]],
  "RODBY_EXIT>CPH_TERMINAL_ARRIVAL": [[54.66, 11.35], [54.78, 11.55], [54.95, 11.82], [55.18, 12.05], [55.45, 12.30], [55.66, 12.47]],
  "RODBY_EXIT>KOGE_TERMINAL_ARRIVAL": [[54.66, 11.35], [54.78, 11.55], [54.95, 11.82], [55.18, 12.05], [55.36, 12.12], [55.46, 12.18]],
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

function mapHeightClass(height) {
  return `ntg-map-height-${Math.round(height)}`;
}

function segmentLatLngs(fromId, toId) {
  const direct = ROAD_SEGMENTS[`${fromId}>${toId}`];
  if (direct) return direct;

  const reverse = ROAD_SEGMENTS[`${toId}>${fromId}`];
  if (reverse) return [...reverse].reverse();

  const fromGate = shipmentData.GATE_BY_ID[fromId];
  const toGate = shipmentData.GATE_BY_ID[toId];
  return fromGate && toGate ? [[fromGate.lat, fromGate.lon], [toGate.lat, toGate.lon]] : [];
}

function routeLatLngs(gateIds) {
  const points = [];
  gateIds.forEach((id, index) => {
    if (index === 0) {
      const gate = shipmentData.GATE_BY_ID[id];
      if (gate) points.push([gate.lat, gate.lon]);
      return;
    }

    const segment = segmentLatLngs(gateIds[index - 1], id);
    segment.forEach((point, segmentIndex) => {
      if (segmentIndex === 0 && points.length) return;
      points.push(point);
    });
  });
  return points;
}

function gateTooltip(gate) {
  return `<div class="ntg-tip-card">
    <div class="ntg-tip-title">${gate.name}</div>
    <div class="ntg-tip-subtitle">Tier ${gate.tier} / ${gate.type}</div>
  </div>`;
}

function shipmentTooltip(shipment) {
  return `<div class="ntg-tip-card">
    <div class="ntg-tip-title">${shipment.id}</div>
    <div class="ntg-tip-copy">${shipment.customer}</div>
    <div class="ntg-tip-subtitle">${shipment.origin} -> ${shipment.destination}</div>
  </div>`;
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
    }).catch((error) => {
      console.error("Leaflet failed to load", error);
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

  React.useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    const { gates: gateLayer, corridors: corridorLayer, trails: trailLayer, dots: dotLayer } = layersRef.current;
    if (!gateLayer) return;

    gateLayer.clearLayers();
    corridorLayer.clearLayers();
    trailLayer.clearLayers();
    dotLayer.clearLayers();

    corridors.forEach((corridor) => {
      const latlngs = routeLatLngs(corridor.gates);
      L.polyline(latlngs, {
        color: corridor.color === "ember" ? accentColor : inkColor,
        weight: corridor.color === "ember" ? 3 : 2,
        opacity: corridor.color === "ember" ? 0.85 : 0.55,
        dashArray: corridor.color === "ember" ? null : "4 6",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(corridorLayer);
    });

    shipments.forEach((shipment) => {
      if (shipment.status === "scheduled" || shipment.events.length < 1) return;

      const isSelected = shipment.id === selectedShipmentId;
      const latlngs = routeLatLngs(shipment.events.map((event) => event.gate));
      if (latlngs.length < 2) return;

      L.polyline(latlngs, {
        color: isSelected ? accentColor : inkColor,
        weight: isSelected ? 4 : 2.4,
        opacity: selectedShipmentId && !isSelected ? 0.18 : (isSelected ? 1 : 0.7),
        lineCap: "round",
      }).addTo(trailLayer);
    });

    gates.forEach((gate) => {
      if (!visibleTiers[gate.tier]) return;

      const radius = gate.tier === 1 ? 9 : gate.tier === 2 ? 7 : gate.tier === 3 ? 6 : 5;
      const marker = L.circleMarker([gate.lat, gate.lon], {
        radius,
        fillColor: paperColor,
        color: inkColor,
        weight: 1.8,
        fillOpacity: 1,
      }).addTo(gateLayer);

      L.circleMarker([gate.lat, gate.lon], {
        radius: radius * 0.4,
        fillColor: inkColor,
        color: inkColor,
        weight: 0,
        fillOpacity: 1,
      }).addTo(gateLayer);

      if (gate.tier === 1) {
        L.circleMarker([gate.lat, gate.lon], {
          radius: radius + 5,
          fillOpacity: 0,
          color: accentColor,
          weight: 1,
          opacity: 0.5,
        }).addTo(gateLayer);
      }

      marker.bindTooltip(gateTooltip(gate), {
        direction: "top",
        offset: [0, -radius - 2],
        className: "ntg-tip",
        permanent: false,
        sticky: false,
      });

      if (onGateClick) marker.on("click", () => onGateClick(gate));
    });

    shipments.forEach((shipment) => {
      if (shipment.status === "scheduled" || shipment.events.length < 1) return;

      const isSelected = shipment.id === selectedShipmentId;
      const lastGate = shipmentData.GATE_BY_ID[shipment.events[shipment.events.length - 1].gate];
      if (!lastGate) return;

      const latlng = [lastGate.lat + 0.02, lastGate.lon + 0.02];
      const dot = L.circleMarker(latlng, {
        radius: isSelected ? 9 : 6,
        fillColor: isSelected ? accentColor : inkColor,
        color: paperColor,
        weight: 2,
        fillOpacity: 1,
        opacity: selectedShipmentId && !isSelected ? 0.2 : 1,
      }).addTo(dotLayer);

      if (onShipmentClick) dot.on("click", () => onShipmentClick(shipment));
      dot.bindTooltip(shipmentTooltip(shipment), {
        direction: "top",
        offset: [0, -10],
        className: "ntg-tip",
      });
    });
  }, [gates, corridors, shipments, selectedShipmentId, visibleTiers, inkColor, paperColor, accentColor, onShipmentClick, onGateClick, ready]);

  return (
    <div className={`ntg-map-shell ntg-map-shell--leaflet ${mapHeightClass(height)}`} data-dark={dark ? "true" : "false"}>
      <div ref={ref} className="ntg-map-canvas" />
      {!ready && (
        <div className="ntg-map-loading">
          {loadError || "Loading live map"}
        </div>
      )}
      <div className="ntg-map-chip ntg-map-chip--top-left">Live network / Denmark / OSM</div>
      <div className="ntg-map-attribution">OpenStreetMap / CARTO</div>
    </div>
  );
}

NTG.features.maps.LeafletDenmark = LeafletDenmark;
