const NTG = window.NTG = window.NTG || {};
NTG.features = NTG.features || {};
NTG.features.maps = NTG.features.maps || {};

const EUROPE_LOCATIONS = [
  { title: "Copenhagen", id: "copenhagen", role: "Hub", coords: [55.6761, 12.5683] },
  { title: "Stockholm", id: "stockholm", role: "Hub", coords: [59.3293, 18.0686] },
  { title: "Oslo", id: "oslo", role: "Hub", coords: [59.9139, 10.7522] },
  { title: "Helsinki", id: "helsinki", role: "Gateway", coords: [60.1699, 24.9384] },
  { title: "Hamburg", id: "hamburg", role: "Main Hub", coords: [53.5511, 9.9937] },
  { title: "Berlin", id: "berlin", role: "Gateway", coords: [52.52, 13.405] },
  { title: "Frankfurt", id: "frankfurt", role: "Gateway", coords: [50.1109, 8.6821] },
  { title: "Rotterdam", id: "rotterdam", role: "Gateway", coords: [51.9244, 4.4777] },
  { title: "Antwerp", id: "antwerp", role: "Gateway", coords: [51.2194, 4.4025] },
  { title: "Paris", id: "paris", role: "Gateway", coords: [48.8566, 2.3522] },
  { title: "Calais", id: "calais", role: "Gateway", coords: [50.9513, 1.8587] },
  { title: "Dover", id: "dover", role: "Gateway", coords: [51.129, 1.308] },
  { title: "London", id: "london", role: "Gateway", coords: [51.5074, -0.1278] },
  { title: "Immingham", id: "immingham", role: "Gateway", coords: [53.6095, -0.1879] },
  { title: "Warsaw", id: "warsaw", role: "Gateway", coords: [52.2297, 21.0122] },
  { title: "Prague", id: "prague", role: "Gateway", coords: [50.0755, 14.4378] },
  { title: "Budapest", id: "budapest", role: "Gateway", coords: [47.4979, 19.0402] },
  { title: "Milan", id: "milan", role: "Gateway", coords: [45.4642, 9.19] },
  { title: "Barcelona", id: "barcelona", role: "Gateway", coords: [41.3851, 2.1734] },
];

const EUROPE_ROUTES = [
  { label: "Copenhagen -> Hamburg", type: "primary", start: "copenhagen", end: "hamburg" },
  { label: "Stockholm -> Hamburg", type: "primary", start: "stockholm", end: "hamburg" },
  { label: "Oslo -> Hamburg", type: "primary", start: "oslo", end: "hamburg" },
  { label: "Hamburg -> Rotterdam", type: "primary", start: "hamburg", end: "rotterdam" },
  { label: "Hamburg -> Antwerp", type: "primary", start: "hamburg", end: "antwerp" },
  { label: "Hamburg -> Paris", type: "primary", start: "hamburg", end: "paris" },
  { label: "Hamburg -> Warsaw", type: "primary", start: "hamburg", end: "warsaw" },
  { label: "Hamburg -> Prague", type: "primary", start: "hamburg", end: "prague" },
  { label: "Hamburg -> Milan", type: "primary", start: "hamburg", end: "milan" },
  { label: "Calais -> Dover", type: "ferry", start: "calais", end: "dover" },
  { label: "Dover -> London", type: "primary", start: "dover", end: "london" },
  { label: "Copenhagen -> Stockholm", type: "secondary", start: "copenhagen", end: "stockholm" },
  { label: "Copenhagen -> Oslo", type: "secondary", start: "copenhagen", end: "oslo" },
  { label: "Hamburg -> Budapest", type: "secondary", start: "hamburg", end: "budapest" },
  { label: "Hamburg -> Barcelona", type: "secondary", start: "hamburg", end: "barcelona" },
  { label: "Rotterdam -> Paris", type: "secondary", start: "rotterdam", end: "paris" },
  { label: "Antwerp -> Calais", type: "secondary", start: "antwerp", end: "calais" },
  { label: "Warsaw -> Prague", type: "secondary", start: "warsaw", end: "prague" },
  { label: "Milan -> Barcelona", type: "secondary", start: "milan", end: "barcelona" },
  { label: "Berlin -> Warsaw", type: "secondary", start: "berlin", end: "warsaw" },
];

const EUROPE_LOCATION_INDEX = Object.fromEntries(EUROPE_LOCATIONS.map((location) => [location.id, location]));
const EUROPE_ROUTE_CACHE = new Map();

let fallbackLeafletPromise = null;
function ensureLeafletRuntime() {
  const runtime = NTG.features.maps.leafletRuntime;
  if (runtime && typeof runtime.loadLeaflet === "function") return runtime.loadLeaflet();
  if (fallbackLeafletPromise) return fallbackLeafletPromise;

  const cssUrl = runtime?.cssUrl || "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const jsUrl = runtime?.jsUrl || "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  fallbackLeafletPromise = new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = jsUrl;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return fallbackLeafletPromise;
}

function routeStyle(type, palette) {
  if (type === "primary") {
    return { color: palette.primary, weight: 4.8, opacity: 0.92 };
  }
  if (type === "secondary") {
    return { color: palette.secondary, weight: 3.2, opacity: 0.84 };
  }
  return { color: palette.ferry, weight: 2.8, opacity: 0.82, dashArray: "10 8" };
}

async function fetchEuropeanRoute(route) {
  const start = EUROPE_LOCATION_INDEX[route.start];
  const end = EUROPE_LOCATION_INDEX[route.end];
  if (!start || !end) return { coords: [], source: "fallback" };

  const cacheKey = `${route.type}:${route.start}:${route.end}`;
  if (EUROPE_ROUTE_CACHE.has(cacheKey)) return EUROPE_ROUTE_CACHE.get(cacheKey);

  const fetchPromise = (async () => {
    if (route.type === "ferry") {
      return { coords: [start.coords, end.coords], source: "ferry" };
    }

    const [startLat, startLon] = start.coords;
    const [endLat, endLon] = end.coords;
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM request failed (${response.status})`);
      const data = await response.json();
      if (!data.routes || !data.routes.length) throw new Error("OSRM returned no routes");

      return {
        coords: data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]),
        source: "live",
      };
    } catch (error) {
      console.warn(`Europe route fallback for ${route.label}`, error);
      return { coords: [start.coords, end.coords], source: "fallback" };
    }
  })();

  EUROPE_ROUTE_CACHE.set(cacheKey, fetchPromise);
  return fetchPromise;
}

function EuropeNetworkMap({
  height = 540,
  dark = false,
  accentColor = "#c2410c",
  inkColor = "#16181d",
  paperColor = "#f6f3ec",
}) {
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  const layerRef = React.useRef({ markers: null, routes: null });
  const [ready, setReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);
  const [routeStatus, setRouteStatus] = React.useState({
    total: EUROPE_ROUTES.length,
    loaded: 0,
    live: 0,
    fallback: 0,
  });

  const palette = React.useMemo(() => ({
    primary: dark ? "#f9735b" : accentColor,
    secondary: dark ? "#f3c969" : "#d4a624",
    ferry: dark ? "#bcc6d4" : "#5f6b7a",
    hubFill: dark ? "#f8fafc" : "#fef6ea",
    hubStroke: dark ? "#0f172a" : inkColor,
    glow: dark ? "rgba(249, 115, 91, 0.18)" : "rgba(194, 65, 12, 0.16)",
  }), [accentColor, dark, inkColor]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setReady(false);

    ensureLeafletRuntime().then((L) => {
      if (cancelled || !ref.current || mapRef.current) return;

      const map = L.map(ref.current, {
        center: [53.7, 11.1],
        zoom: 4,
        minZoom: 3,
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
      L.tileLayer(labelsUrl, { maxZoom: 18, subdomains: "abcd", opacity: 0.88, pane: "shadowPane" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      layerRef.current.routes = L.layerGroup().addTo(map);
      layerRef.current.markers = L.layerGroup().addTo(map);
      setReady(true);
    }).catch((error) => {
      console.error("Leaflet failed to load for Europe network map", error);
      if (!cancelled) setLoadError("Europe network map could not load. Check Leaflet or routing access.");
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
    if (!ready || !L || !mapRef.current || !layerRef.current.markers || !layerRef.current.routes) return undefined;

    const markersLayer = layerRef.current.markers;
    const routesLayer = layerRef.current.routes;
    markersLayer.clearLayers();
    routesLayer.clearLayers();

    EUROPE_LOCATIONS.forEach((location) => {
      const radius = location.role === "Main Hub" ? 8.5 : location.role === "Hub" ? 7 : 5.5;
      const marker = L.circleMarker(location.coords, {
        radius,
        color: palette.hubStroke,
        fillColor: location.role === "Main Hub" ? palette.primary : palette.hubFill,
        fillOpacity: 1,
        weight: location.role === "Main Hub" ? 2.4 : 1.8,
      }).addTo(markersLayer);

      if (location.role === "Main Hub") {
        L.circleMarker(location.coords, {
          radius: radius + 6,
          color: palette.primary,
          fillOpacity: 0,
          opacity: 0.42,
          weight: 1.1,
        }).addTo(markersLayer);
      }

      marker.bindTooltip(
        `<div style="font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; font-weight:600">${location.title}</div><div style="font-family:'JetBrains Mono', monospace; font-size:9px; opacity:.68">${location.role}</div>`,
        { direction: "top", offset: [0, -radius - 2], className: "ntg-tip" }
      );
      marker.bindPopup(`<strong>${location.title}</strong><br>${location.role}`);
    });

    let active = true;
    setRouteStatus({ total: EUROPE_ROUTES.length, loaded: 0, live: 0, fallback: 0 });

    Promise.all(EUROPE_ROUTES.map((route) => fetchEuropeanRoute(route).then((resolved) => ({ route, resolved })))).then((results) => {
      if (!active) return;

      let live = 0;
      let fallback = 0;

      results.forEach(({ route, resolved }) => {
        if (resolved.source === "live") live += 1;
        if (resolved.source === "fallback") fallback += 1;

        const polyline = L.polyline(resolved.coords, routeStyle(route.type, palette)).addTo(routesLayer);
        polyline.bindPopup(`<strong>${route.label}</strong><br>${route.type[0].toUpperCase()}${route.type.slice(1)} corridor`);
        polyline.bindTooltip(route.label, { sticky: true, className: "ntg-tip" });
        polyline.on("mouseover", () => polyline.setStyle({ weight: routeStyle(route.type, palette).weight + 1.4, opacity: 1 }));
        polyline.on("mouseout", () => polyline.setStyle(routeStyle(route.type, palette)));
      });

      setRouteStatus({
        total: EUROPE_ROUTES.length,
        loaded: EUROPE_ROUTES.length,
        live,
        fallback,
      });
    });

    return () => {
      active = false;
    };
  }, [palette, ready]);

  const statusLabel = !ready
    ? (loadError || "Loading Europe network")
    : routeStatus.loaded < routeStatus.total
      ? `Routing ${routeStatus.loaded}/${routeStatus.total} corridors`
      : routeStatus.fallback
        ? `${routeStatus.live} live routes, ${routeStatus.fallback} fallback segments`
        : "All corridors resolved with live road routing";

  return (
    <div style={{ position: "relative", width: "100%", height, background: dark ? "#171a21" : "#edf2f7" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />

      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 500,
        display: "grid",
        gap: 10,
        width: "min(320px, calc(100% - 32px))",
      }}>
        <div style={{
          padding: "12px 14px",
          borderRadius: 18,
          background: dark ? "rgba(12, 15, 20, 0.78)" : "rgba(255, 252, 247, 0.86)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 22px 40px ${palette.glow}`,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: inkColor, opacity: 0.68 }}>
            Imported network map
          </div>
          <div style={{ marginTop: 8, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 0.96, color: inkColor }}>
            NTG Europe corridor view
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55, color: inkColor, opacity: 0.72 }}>
            Real road routing for the broader NTG network, layered into the dashboard without leaving the app.
          </div>
        </div>

        <div style={{
          padding: "12px 14px",
          borderRadius: 18,
          background: dark ? "rgba(12, 15, 20, 0.72)" : "rgba(255, 255, 255, 0.82)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "grid",
          gap: 8,
        }}>
          {[
            { label: "Primary corridors", tone: palette.primary, dashed: false },
            { label: "Secondary routes", tone: palette.secondary, dashed: false },
            { label: "Ferry segment", tone: palette.ferry, dashed: true },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: inkColor }}>
              <span style={{
                width: 34,
                height: 10,
                borderRadius: 999,
                border: item.dashed ? `1px solid ${item.tone}` : "none",
                background: item.dashed
                  ? `repeating-linear-gradient(90deg, ${item.tone} 0 8px, transparent 8px 14px)`
                  : item.tone,
              }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute",
        right: 16,
        top: 16,
        zIndex: 500,
        padding: "10px 12px",
        borderRadius: 16,
        background: dark ? "rgba(12, 15, 20, 0.74)" : "rgba(255, 255, 255, 0.84)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: inkColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        maxWidth: 260,
      }}>
        {statusLabel}
      </div>

      <div style={{
        position: "absolute",
        left: 16,
        bottom: 12,
        zIndex: 500,
        padding: "9px 11px",
        borderRadius: 14,
        background: dark ? "rgba(12, 15, 20, 0.68)" : "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
        color: inkColor,
        fontSize: 11,
        lineHeight: 1.45,
      }}>
        19 locations, 20 routes, OSRM road geometry with straight-line fallback.
      </div>
    </div>
  );
}

NTG.features.maps.EuropeNetworkMap = EuropeNetworkMap;
