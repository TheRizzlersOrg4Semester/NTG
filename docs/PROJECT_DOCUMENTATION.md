# NTG Pulse / Smart Checkpoints Project Documentation

## Purpose

NTG Pulse is a Proof of Concept for event-based ROAD freight visibility, focused on the UK -> Denmark/Nordics corridor.

The PoC is not a live tracking or ANPR camera product. It demonstrates a verified freight milestone layer where partner gates send event-only confirmations, and those events are validated before updating shipment visibility.

Core flow:

```text
Gate event simulator
-> Event ingestion API
-> Validation engine
-> Shipment visibility update or manual review
-> Dashboard / map / timeline
```

## Architecture

The project is a lightweight Dockerized prototype:

- Browser UI served by a small Node/Express app
- SQLite stores the current dashboard state as JSON
- Frontend modules communicate through a shared `window.NTG` namespace
- No frontend build step is used; scripts are loaded by `Smart Checkpoints.html`

## Project Structure

- `Smart Checkpoints.html` - browser entrypoint that loads the app modules
- `package.json` - backend runtime dependencies and start script
- `Dockerfile` - app container image
- `docker-compose.yml` - local Docker runtime with persistent SQLite storage
- `src/app` - app bootstrap, shell layout, config, theme
- `src/domain/shipments/mock-data.jsx` - synthetic gates, routes, shipments, events
- `src/domain/shipments/service.jsx` - frontend shipment helpers, stats, simulation wrappers, business impact logic
- `src/features/dashboard/overview.jsx` - main dashboard/control tower overview
- `src/features/dashboard/dashboard.css` - overview/dashboard styling
- `src/features/shipments/views.jsx` - shipment table, detail drawer, exception queue, analytics
- `src/features/shipments/shipments.css` - shipment/detail/analytics styling
- `src/features/maps` - schematic, Leaflet, and Europe map views
- `src/shared/ui` - global CSS and tweak panel
- `src/shared/utils/formatters.jsx` - formatting helpers
- `server/index.js` - Express server and API routes
- `server/database.js` - SQLite connection and app state persistence
- `server/bootstrap-source.js` - loads frontend seed data into backend state
- `server/bootstrap-state.js` - backend state helpers and demo simulation scenarios
- `server/validation-engine.js` - gate event validation and state application
- `data/samples` - sample payloads
- `data/schemas` - JSON schema references
- `storage` - local SQLite database location for non-Docker runs

## Runtime Data Flow

1. Browser opens `Smart Checkpoints.html`.
2. Frontend requests state from `GET /api/bootstrap`.
3. Backend reads current app state from SQLite.
4. Dashboard renders shipments, gates, route, events, exceptions, and business impact.
5. Simulated or ingested gate events go through validation.
6. Confirmed events update shipment timeline/progress.
7. Needs review or rejected events are kept visible as review/exception events.
8. Updated state is saved back to SQLite.

## Main API Endpoints

### `GET /api/health`

Health check for the backend.

### `GET /api/bootstrap`

Returns the current persisted app state.

### `POST /api/reset`

Resets SQLite state to the canonical frontend mock dataset.

### `POST /api/simulate`

Runs a demo scenario through the same validation path as real gate event ingestion.

Supported scenarios:

- `confirmed`
- `low_confidence`
- `wrong_gate`
- `route_deviation`
- `equipment_handover`

Example:

```json
{
  "scenario": "low_confidence"
}
```

### `POST /api/gate-events`

Ingests a gate event payload and validates it.

Example:

```json
{
  "event_id": "evt_demo_001",
  "shipment_id": "SHP-2026-00421",
  "gate_id": "RODBY_EXIT",
  "event_type": "GATE_PASSED",
  "plate_hash": "8f41ab92",
  "equipment_id": "TRAILER-NTG-4412",
  "timestamp": "2026-05-07T11:42:00Z",
  "direction": "INBOUND_DK",
  "confidence_score": 0.94,
  "source": "SIMULATED_GATE"
}
```

## Validation Logic

Gate events are checked for:

- Shipment exists
- Shipment is active/in transit
- Gate exists
- Gate belongs to planned route
- Gate order makes sense for the route
- Equipment/trailer/plate match when data is available
- Confidence threshold

Status mapping:

- `confirmed`: confidence >= 0.90 and checks pass
- `needs_review`: confidence >= 0.70 and < 0.90, or recoverable uncertainty
- `rejected`: confidence < 0.70 or hard mismatch

Validation returns a reason and a list of checks so the UI can explain why an event was accepted, reviewed, or rejected.

## Default Demo Route

The primary demo shipment is `SHP-2026-00421`.

Route:

```text
Lichfield / Manchester Origin
-> Folkestone Check-in
-> Coquelles Exit
-> Hamburg Corridor
-> Puttgarden Check-in
-> Rodby Exit
-> Koge Terminal Arrival
```

This keeps the demo focused on a small number of high-value verified freight milestones rather than broad GPS-style tracking.

## Frontend Demo Features

- UK -> Denmark corridor map
- Active shipment table
- Recent gate event log
- Shipment detail drawer with timeline
- Confidence/status visibility
- Needs review/manual review visibility
- Equipment handover representation
- Privacy-safe event model panel
- Business impact/customer impact panel
- Internal/customer audience toggle
- Guided Start demo flow

## Business Impact Logic

Business impact is calculated in `src/domain/shipments/service.jsx` through `getBusinessImpact(shipment)`.

Inputs include:

- Customer tier
- Cargo profile
- ETA impact
- SLA risk
- Event status
- Route deviation/rejected event signals

The helper returns:

- Customer tier
- Cargo profile
- ETA impact
- SLA risk
- Customer impact
- Recommended action
- Short explanation

## Editing Guide

Common places to change behavior:

- Update shipment/gate/route data: `src/domain/shipments/mock-data.jsx`
- Adjust frontend shipment helpers: `src/domain/shipments/service.jsx`
- Change overview UI: `src/features/dashboard/overview.jsx`
- Change overview styling: `src/features/dashboard/dashboard.css`
- Change shipment/detail UI: `src/features/shipments/views.jsx`
- Change shipment/detail styling: `src/features/shipments/shipments.css`
- Change validation behavior: `server/validation-engine.js`
- Change simulate scenarios: `server/bootstrap-state.js`
- Change API/persistence behavior: `server/index.js`, `server/database.js`

Avoid changing map behavior unless the task specifically requires it. The map components are intentionally kept stable for demo reliability.

## External Runtime Dependencies

The prototype loads some browser assets from CDNs:

- React, ReactDOM, and Babel from `unpkg.com`
- Fonts from Google Fonts
- Leaflet from `unpkg.com`
- Carto map tiles for the geographic map

Docker build installs backend Node dependencies inside the container.

## Notes

- The dataset is synthetic.
- SQLite stores the current app state so demo actions persist until reset.
- This is a PoC, not a production enterprise architecture.
- The intended demo story is verified milestone visibility, not live surveillance or raw plate tracking.
