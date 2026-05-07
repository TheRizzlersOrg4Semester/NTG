// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML = '<div style="padding: 20px; color: red; text-align: center;">Error: Leaflet library not loaded.<br>Please refresh the page.</div>';
    return;
  }

  initializeMap();
});

async function getRoute(startCoords, endCoords, type) {
  const [startLat, startLng] = startCoords;
  const [endLat, endLng] = endCoords;
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM request failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('OSRM returned no routes');
    }

    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.error(`OSRM route error for ${type} route ${startCoords} → ${endCoords}:`, error);
    return [startCoords, endCoords];
  }
}

function initializeMap() {
  const map = L.map('map').setView([54.5, 10.0], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const locations = [
    { title: 'Copenhagen', id: 'copenhagen', role: 'Hub', coords: [55.6761, 12.5683] },
    { title: 'Stockholm', id: 'stockholm', role: 'Hub', coords: [59.3293, 18.0686] },
    { title: 'Oslo', id: 'oslo', role: 'Hub', coords: [59.9139, 10.7522] },
    { title: 'Helsinki', id: 'helsinki', role: 'Gateway', coords: [60.1699, 24.9384] },
    { title: 'Hamburg', id: 'hamburg', role: 'Main Hub', coords: [53.5511, 9.9937] },
    { title: 'Berlin', id: 'berlin', role: 'Gateway', coords: [52.5200, 13.4050] },
    { title: 'Frankfurt', id: 'frankfurt', role: 'Gateway', coords: [50.1109, 8.6821] },
    { title: 'Rotterdam', id: 'rotterdam', role: 'Gateway', coords: [51.9244, 4.4777] },
    { title: 'Antwerp', id: 'antwerp', role: 'Gateway', coords: [51.2194, 4.4025] },
    { title: 'Paris', id: 'paris', role: 'Gateway', coords: [48.8566, 2.3522] },
    { title: 'Calais', id: 'calais', role: 'Gateway', coords: [50.9513, 1.8587] },
    { title: 'Dover', id: 'dover', role: 'Gateway', coords: [51.1290, 1.3080] },
    { title: 'London', id: 'london', role: 'Gateway', coords: [51.5074, -0.1278] },
    { title: 'Immingham', id: 'immingham', role: 'Gateway', coords: [53.6095, -0.1879] },
    { title: 'Warsaw', id: 'warsaw', role: 'Gateway', coords: [52.2297, 21.0122] },
    { title: 'Prague', id: 'prague', role: 'Gateway', coords: [50.0755, 14.4378] },
    { title: 'Budapest', id: 'budapest', role: 'Gateway', coords: [47.4979, 19.0402] },
    { title: 'Milan', id: 'milan', role: 'Gateway', coords: [45.4642, 9.1900] },
    { title: 'Barcelona', id: 'barcelona', role: 'Gateway', coords: [41.3851, 2.1734] }
  ];

  const locationIndex = {};
  locations.forEach(location => {
    locationIndex[location.id] = location;
  });

  const routes = [
    { label: 'Copenhagen → Hamburg', type: 'primary', start: 'copenhagen', end: 'hamburg', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Stockholm → Hamburg', type: 'primary', start: 'stockholm', end: 'hamburg', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Oslo → Hamburg', type: 'primary', start: 'oslo', end: 'hamburg', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Rotterdam', type: 'primary', start: 'hamburg', end: 'rotterdam', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Antwerp', type: 'primary', start: 'hamburg', end: 'antwerp', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Paris', type: 'primary', start: 'hamburg', end: 'paris', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Warsaw', type: 'primary', start: 'hamburg', end: 'warsaw', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Prague', type: 'primary', start: 'hamburg', end: 'prague', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Hamburg → Milan', type: 'primary', start: 'hamburg', end: 'milan', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Calais → Dover', type: 'ferry', start: 'calais', end: 'dover', style: { color: '#4b5563', weight: 4, opacity: 0.9, dashArray: '10, 10' } },
    { label: 'Dover → London', type: 'primary', start: 'dover', end: 'london', style: { color: '#d63f3f', weight: 6, opacity: 0.9 } },
    { label: 'Copenhagen → Stockholm', type: 'secondary', start: 'copenhagen', end: 'stockholm', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Copenhagen → Oslo', type: 'secondary', start: 'copenhagen', end: 'oslo', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Hamburg → Budapest', type: 'secondary', start: 'hamburg', end: 'budapest', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Hamburg → Barcelona', type: 'secondary', start: 'hamburg', end: 'barcelona', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Rotterdam → Paris', type: 'secondary', start: 'rotterdam', end: 'paris', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Antwerp → Calais', type: 'secondary', start: 'antwerp', end: 'calais', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Warsaw → Prague', type: 'secondary', start: 'warsaw', end: 'prague', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Milan → Barcelona', type: 'secondary', start: 'milan', end: 'barcelona', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } },
    { label: 'Berlin → Warsaw', type: 'secondary', start: 'berlin', end: 'warsaw', style: { color: '#e0b83d', weight: 4, opacity: 0.85 } }
  ];

  locations.forEach(location => {
    const marker = L.circleMarker(location.coords, {
      color: '#111827',
      fillColor: '#fbbf24',
      fillOpacity: 1,
      radius: 8,
      weight: 2
    }).addTo(map);

    marker.bindPopup(`<strong>${location.title}</strong><br>${location.role}`);
  });

  const style = document.createElement('style');
  style.textContent = `
    .legend {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .legend-title {
      font-weight: 700;
      margin-bottom: 8px;
    }
    .legend-icon {
      display: inline-block;
      width: 28px;
      height: 10px;
      margin-right: 8px;
      vertical-align: middle;
      border-radius: 4px;
    }
    .legend-primary {
      background: #d63f3f;
    }
    .legend-secondary {
      background: #e0b83d;
    }
    .legend-ferry {
      background: linear-gradient(90deg, #4b5563 50%, transparent 50%);
      background-size: 8px 100%;
      border: 1px solid #4b5563;
    }
  `;
  document.head.appendChild(style);

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div class="legend-title">Network Legend</div>
      <div><span class="legend-icon legend-primary"></span>Primary NTG corridors</div>
      <div><span class="legend-icon legend-secondary"></span>Secondary routes</div>
      <div><span class="legend-icon legend-ferry"></span>Ferry route</div>
    `;
    return div;
  };
  legend.addTo(map);

  (async () => {
    for (const route of routes) {
      const start = locationIndex[route.start];
      const end = locationIndex[route.end];

      if (!start || !end) {
        console.warn(`Route skipped: missing location ${route.start} or ${route.end}`);
        continue;
      }

      let routeCoords;
      if (route.type === 'ferry') {
        routeCoords = [start.coords, end.coords];
      } else {
        routeCoords = await getRoute(start.coords, end.coords, route.type);
      }

      const polyline = L.polyline(routeCoords, route.style).addTo(map);
      polyline.bindPopup(`<strong>${route.label}</strong><br>${route.type.charAt(0).toUpperCase() + route.type.slice(1)} route`);
    }
  })();
}
