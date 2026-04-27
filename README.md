# NTG Smart Checkpoints

Prototype dashboard for visualizing NTG shipment flow through a small set of smart freight checkpoints in Denmark.

The project is a browser-based proof of concept built as a static page with React loaded from CDNs. There is no build step, package installation, or backend in this repository.

## Project Structure

- `Smart Checkpoints.html` - main entrypoint that bootstraps the app
- `data.jsx` - synthetic gate, corridor, and shipment dataset
- `views.jsx` - shipment list, detail drawer, exceptions, and analytics views
- `denmark-map.jsx` - schematic Denmark map renderer
- `leaflet-map.jsx` - geographic map renderer using Leaflet and online map tiles
- `tweaks-panel.jsx` - floating prototype controls used for theme and display options
- `shipment_sample.json` - sample shipment payload
- `shipment_schema.json` - JSON schema reference for shipment data

## Requirements

- A modern browser such as Chrome, Edge, or Firefox
- Internet access

Internet access is required because the prototype loads:

- React, ReactDOM, and Babel from `unpkg.com`
- Fonts from Google Fonts
- Leaflet from `unpkg.com`
- Map tiles from Carto when the geographic map is used

## How To Start

The project is easiest to run from a small local web server.

### Option 1: Python

If Python is installed, run this from the project folder:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/Smart%20Checkpoints.html
```

### Option 2: VS Code Live Server

If you use VS Code, you can open the folder and start `Smart Checkpoints.html` with the Live Server extension.

### Option 3: Open The File Directly

You can also open `Smart Checkpoints.html` directly in a browser, but a local server is recommended because browser security rules can differ for local files.

## How To Use The Prototype

- Use the left sidebar to switch between `Overview`, `Shipments`, `Exceptions`, and `Analytics`
- Use the audience switch to toggle between internal and customer-facing views
- Open shipments to inspect route progress, gate events, and details
- Use the tweaks panel controls if the prototype host enables edit mode
- In internal mode, use the simulate action to add a new gate event to an active shipment

## Editing The Prototype

Common places to change behavior:

- Update shipment or gate data in `data.jsx`
- Adjust layout and UI behavior in `views.jsx`
- Change theme defaults and app bootstrapping in `Smart Checkpoints.html`
- Modify map rendering in `denmark-map.jsx` or `leaflet-map.jsx`

## Notes

- This repository currently contains mock data only
- The app is designed as a prototype, not a production-ready application
- The geographic map depends on third-party CDNs and tile providers
