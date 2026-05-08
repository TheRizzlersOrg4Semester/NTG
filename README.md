# NTG Pulse / Smart Checkpoints

Small Proof of Concept for event-based shipment visibility on the UK -> Denmark freight corridor.

The app demonstrates how partner gate events can be validated and turned into verified freight milestones, exception visibility, and customer-facing shipment status.

## Requirements

- Docker Desktop or compatible Docker Engine with Docker Compose
- A modern browser
- Internet access for CDN-loaded frontend libraries and map tiles

No local `npm install` is required when running through Docker.

## Start

From the project folder:

```powershell
docker compose up --build
```

Open:

```text
http://localhost:3000
```

## Stop

```powershell
docker compose down
```

Remove persisted demo database state too:

```powershell
docker compose down -v
```

## More Documentation

See [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) for project structure, data flow, architecture notes, API details, and editing guidance.
