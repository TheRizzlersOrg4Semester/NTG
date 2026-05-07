# NTG Nordic Transport Group - European Logistics Network Map

An interactive web map visualizing NTG's European road freight network using real road routing.

## Features

- **Interactive Map**: Built with Leaflet.js showing Europe at zoom level 5
- **Real Road Routing**: Uses OSRM API to display actual highways and roads (not straight lines)
- **19 Locations**: Hubs and gateways across Northern, Central, Western, Eastern, and Southern Europe
- **21 Transport Routes**:
  - 🔴 **11 Primary Routes** (red, thick lines) - Main NTG corridors
  - 🟡 **9 Secondary Routes** (yellow, medium lines) - Supporting connections
  - ⚓ **1 Ferry Route** (grey dashed) - Calais ↔ Dover
- **Interactive Elements**: Click markers and routes for detailed information
- **Legend**: Built-in map legend explaining route types

## Locations

### Nordics
- Copenhagen, Stockholm, Oslo, Helsinki

### Central Europe
- Hamburg (Main Hub), Berlin, Frankfurt

### Benelux
- Rotterdam, Antwerp

### Western Europe
- Paris, Calais

### UK
- Dover, London, Immingham

### Eastern Europe
- Warsaw, Prague, Budapest

### Southern Europe
- Milan, Barcelona

## Technology Stack

- **Leaflet.js v1.9.4**: Interactive mapping library
- **OSRM API**: Open-source routing engine for real road data
- **HTML5/CSS3/JavaScript ES6+**: Core web technologies
- **Local Development**: Python HTTP server for testing

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection (for OSRM API calls)

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Route Details

### Primary Routes (Red)
1. Copenhagen → Hamburg
2. Stockholm → Hamburg
3. Oslo → Hamburg
4. Hamburg → Rotterdam
5. Hamburg → Antwerp
6. Hamburg → Paris
7. Hamburg → Warsaw
8. Hamburg → Prague
9. Hamburg → Milan
10. Calais → Dover (ferry)
11. Dover → London

### Secondary Routes (Yellow)
1. Copenhagen → Stockholm
2. Copenhagen → Oslo
3. Hamburg → Budapest
4. Hamburg → Barcelona
5. Rotterdam → Paris
6. Antwerp → Calais
7. Warsaw → Prague
8. Milan → Barcelona
9. Berlin → Warsaw

## API Usage

The map uses the OSRM (Open Source Routing Machine) API for real road routing:
- Endpoint: `https://router.project-osrm.org/route/v1/driving/`
- Parameters: `overview=full&geometries=geojson`
- Rate limiting: Built-in delays to prevent API overload

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is open source. Feel free to use and modify.

## About NTG

NTG Nordic Transport Group is a leading Nordic logistics company specializing in road freight transportation across Europe.