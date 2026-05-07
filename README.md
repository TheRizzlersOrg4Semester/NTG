# NTG Smart Checkpoints

Prototype dashboard for visualizing NTG shipment flow through a small set of smart freight checkpoints in Denmark.

The project is now a lightweight Dockerized prototype: a browser UI served by a small Node app, with SQLite persisting the dashboard state that powers the frontend.

## Architecture

The repo now follows a light clean-architecture split while staying compatible with the original no-build setup:

- `src/app` - frontend app bootstrapping, theme setup, and shell composition
- `src/domain` - shipment data and domain services
- `src/features` - feature-specific UI such as maps, overview, and shipment screens
- `src/shared` - shared UI primitives, global styling, and utility helpers
- `server` - backend API and SQLite integration
- `data` - sample payloads and schema references
- `storage` - local SQLite database location for non-Docker runs

The frontend modules still communicate through a single `window.NTG` namespace so the browser entrypoint stays simple without scattering top-level globals everywhere. Shared CSS lives under `src/shared/ui`, app startup/config scripts live in `src/app`, and the backend persists the bootstrap dataset in SQLite as application state.

## Project Structure

- `Smart Checkpoints.html` - thin browser entrypoint that loads the application modules
- `package.json` - backend runtime dependencies and start script
- `Dockerfile` - application container image
- `docker-compose.yml` - application stack with persistent SQLite storage
- `src/app/config.js` - external app configuration and tweak defaults
- `src/app/bootstrap.js` - app startup entry for mounting the UI
- `src/app/main.jsx` - app shell and React mount flow
- `src/app/shell-ui.jsx` - shell-specific presentational components
- `src/app/theme.jsx` - theme tokens and shared card styling helpers
- `src/domain/shipments/mock-data.jsx` - synthetic gates, corridors, and shipments
- `src/domain/shipments/service.jsx` - shipment filtering, stats, and simulation logic
- `src/features/dashboard/overview.jsx` - overview landing experience
- `src/features/dashboard/overview-ui.jsx` - overview-specific display cards and supporting UI
- `src/features/shipments/views.jsx` - shipments, details, exceptions, and analytics
- `src/features/maps` - schematic and geographic map renderers
- `src/features/maps/europe-network-map.jsx` - imported Europe corridor map integrated into the dashboard
- `src/shared/ui/global-styles.jsx` - global app CSS and shared interaction styling
- `src/shared/ui/tweaks-panel.jsx` - floating prototype controls
- `src/shared/utils/formatters.jsx` - shared date, time, and status helpers
- `server/index.js` - Express server that serves the UI and API
- `server/database.js` - SQLite connection, schema bootstrap, and state persistence
- `server/bootstrap-source.js` - loads the canonical frontend bootstrap dataset for seeding
- `server/bootstrap-state.js` - backend state cloning and simulation helpers
- `storage/.gitkeep` - keeps the SQLite storage folder in the repo
- `data/samples/shipment_sample.json` - sample shipment payload
- `data/schemas/shipment_schema.json` - JSON schema reference for shipment data

## Requirements

- Docker Desktop or a compatible Docker Engine with Docker Compose
- A modern browser such as Chrome, Edge, or Firefox
- Internet access

Internet access is required because the prototype loads:

- React, ReactDOM, and Babel from `unpkg.com`
- Fonts from Google Fonts
- Leaflet from `unpkg.com`
- Map tiles from Carto when the geographic map is used
- Node packages during Docker image build

## How To Start

Start the full stack from the project folder:

```powershell
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

The stack includes:

- `app` - Node server that serves the frontend and `/api/*` endpoints
- `sqlite_data` volume - persistent storage for the SQLite database file

To stop the stack:

```powershell
docker compose down
```

To stop it and remove the database volume too:

```powershell
docker compose down -v
```

## Database

The database is used by the running app, not just included alongside it.

- The frontend loads its bootstrap dataset from `GET /api/bootstrap`
- Simulate actions persist through `POST /api/simulate`
- Reset actions restore the canonical seed through `POST /api/reset`
- Health can be checked through `GET /api/health`

The backend stores the dashboard state in a SQLite file at `storage/ntg-smart-checkpoints.sqlite` locally, or `/app/storage/ntg-smart-checkpoints.sqlite` in Docker. The payload is stored as JSON text inside the `app_state` table, which keeps the prototype simple while still giving the stack a real persistent database.

## How To Use The Prototype

- Use the left sidebar to switch between `Overview`, `Shipments`, `Exceptions`, and `Analytics`
- Use the audience switch to toggle between internal and customer-facing views
- Open shipments to inspect route progress, gate events, and details
- Use the map style control to switch between schematic Denmark, live Denmark, and the imported Europe corridor network
- Use the tweaks panel controls if the prototype host enables edit mode
- In internal mode, use the simulate action to add a new gate event to an active shipment
- The live feed card shows whether the UI is running from the database-backed API or local fallback mode

## Editing The Prototype

Common places to change behavior:

- Update shipment or gate data in `src/domain/shipments/mock-data.jsx`
- Adjust shipment workflows in `src/domain/shipments/service.jsx`
- Change app composition in `src/app/main.jsx`
- Adjust shell presentation in `src/app/shell-ui.jsx`
- Modify overview presentation in `src/features/dashboard/overview.jsx`
- Update overview card styling in `src/features/dashboard/overview-ui.jsx`
- Modify list, detail, exception, and analytics views in `src/features/shipments/views.jsx`
- Change global app styling in `src/shared/ui/global-styles.jsx`
- Change map rendering in `src/features/maps`
- Update API or persistence behavior in `server`

## Notes

- This repository still contains synthetic shipment data, even though it is now persisted through SQLite
- The app is designed as a prototype, not a production-ready application
- The geographic map depends on third-party CDNs and tile providers
