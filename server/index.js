const express = require("express");
const path = require("path");
const {
  createDatabase,
  initializeDatabase,
  getBootstrapState,
  saveBootstrapState,
  resetBootstrapState,
  getDatabaseHealth,
} = require("./database");
const { buildBootstrapResponse, simulateScenarioEvent } = require("./bootstrap-state");
const { applyGateEvent } = require("./validation-engine");

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = path.join(__dirname, "..");
const database = createDatabase();

app.use(express.json());
app.use(express.static(rootDir, { extensions: ["html"] }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "Smart Checkpoints.html"));
});

app.get("/api/health", async (_req, res) => {
  try {
    const dbResult = getDatabaseHealth(database);
    res.json({
      ok: true,
      database: "connected",
      serverTime: dbResult.server_time,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: "disconnected",
      error: error.message,
    });
  }
});

app.get("/api/bootstrap", async (_req, res, next) => {
  try {
    const payload = getBootstrapState(database);
    res.json({
      payload: buildBootstrapResponse(payload),
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/simulate", async (req, res, next) => {
  try {
    const payload = getBootstrapState(database);
    const now = Number(req.body?.now || Date.now());
    const scenario = req.body?.scenario || "confirmed";
    const result = simulateScenarioEvent(payload, null, now, scenario);

    saveBootstrapState(database, result.payload);

    res.json({
      payload: buildBootstrapResponse(result.payload),
      recentEvent: result.recentEvent,
      validation: result.validation,
      event: result.event,
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/gate-events", async (req, res, next) => {
  try {
    const payload = getBootstrapState(database);
    const result = applyGateEvent(payload, req.body || {});

    saveBootstrapState(database, result.payload);

    res.json({
      validation: {
        status: result.validation.status,
        reason: result.validation.reason,
        validation_checks: result.validation.validation_checks,
      },
      event: result.event,
      shipment: result.shipment,
      payload: buildBootstrapResponse(result.payload),
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reset", async (_req, res, next) => {
  try {
    const payload = resetBootstrapState(database);
    res.json({
      payload: buildBootstrapResponse(payload),
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    ok: false,
    error: error.message || "Unexpected server error.",
  });
});

async function start() {
  initializeDatabase(database);

  app.listen(port, () => {
    console.log(`NTG Smart Checkpoints listening on http://0.0.0.0:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
